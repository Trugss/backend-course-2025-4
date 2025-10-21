const http = require('http');
const fs = require('fs/promises');
const path = require('path');
const { program } = require('commander');
const { XMLBuilder } = require('fast-xml-parser');
const url = require('url');

program
  .requiredOption('-i, --input <file>', 'Input JSON file path')
  .requiredOption('-h, --host <host>', 'Server host')
  .requiredOption('-p, --port <port>', 'Server port', parseInt);

program.parse(process.argv);
const options = program.opts();

async function readMtcarsAsMultipleJSON(filePath) {
  try {
    const fullPath = path.resolve(__dirname, filePath);
    console.log('Reading file from:', fullPath);
    const raw = await fs.readFile(fullPath, 'utf8');

    const lines = raw.split(/\r?\n/).filter(line => line.trim());

    const objects = [];
    for (const line of lines) {
      try {
        let obj = JSON.parse(line);
        objects.push(obj);
      } catch (e) {
        throw new Error('File format is not supported for line: ' + line);
      }
    }

    return objects.length === 1 ? objects[0] : objects; 
  } catch (err) {
    console.error('Error reading file:', err);
    throw new Error('Cannot parse input file properly: ' + filePath);
  }
}

function filterCars(data, query) {
  let filtered = Array.isArray(data) ? [...data] : [];

  if (query.cylinders !== 'true') {
  }

  if (query.max_mpg) {
    const maxMpg = parseFloat(query.max_mpg);
    filtered = filtered.filter(car => car.mpg < maxMpg);
  }

  return filtered;
}

function buildXML(cars, query) {
  const rootName = 'cars';
  const itemName = 'car';

  const carsForXml = cars.map(car => {
    let obj = { model: car.model };
    if (query.cylinders === 'true') obj.cyl = car.cyl;
    obj.mpg = car.mpg;
    return obj;
  });

  const builder = new XMLBuilder({
    ignoreAttributes: false,
    format: true,
    suppressEmptyNode: true,
  });

  return builder.build({ [rootName]: { [itemName]: carsForXml } });
}

const server = http.createServer(async (req, res) => {
  try {
    const reqUrl = url.parse(req.url, true);
    const query = reqUrl.query;

    const carsData = await readMtcarsAsMultipleJSON(options.input);
    const filteredCars = filterCars(carsData, query);
    const xmlResponse = buildXML(filteredCars, query);

    res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8' });
    res.end(xmlResponse);
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(err.message);
  }
});

server.listen(options.port, options.host, () => {
  console.log(`Server running at http://${options.host}:${options.port}/`);
});

