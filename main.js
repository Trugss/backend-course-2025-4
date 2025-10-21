const { program } = require('commander');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { XMLBuilder } = require ('fast-xml-parser');
const { URL } = require ('url');

program
  .requiredOption('-i, --input <path>', 'шлях до файлу для читання')
  .requiredOption('-h, --host <address>', 'адреса сервера')
  .requiredOption('-p, --port <number>', 'порт сервера')
  .parse(process.argv);

const options = program.opts();
const inputFile = path.resolve(options.input);
const host = options.host;
const port = parseInt(options.port, 10);

if (!fs.existsSync(inputFile)) {
  console.error("Cannot find input file");
  process.exit(1);
}

function startServer() {
  const server = http.createServer(async (req, res) => {
	  const parsedUrl = new URL(req.url, `http://${host}:${port}`);
const query = parsedUrl.searchParams;

const maxMpg = parseFloat(query.get('max_mpg'));
const showCyl = query.get('cylinders') === 'true';

try {
    const data = await fs.promises.readFile(inputFile, { encoding: 'utf8' });
    const records = JSON.parse(data);

    const dataArray = Object.keys(records).map(model => ({
        model: model,
        ...records[model]
    }));

    const filteredRecords = dataArray.filter(record => {
        if (!isNaN(maxMpg)) {
            return record.mpg < maxMpg;
        }
        return true;
    }).map(record => {
        const projectedRecord = {
            model: record.model,
            ...(showCyl ? { cyl: record.cyl } : {}),
            mpg: record.mpg
        };

        return { car: projectedRecord }; 
    });

    const rootObject = { cars: filteredRecords };

    const builder = new XMLBuilder({
        arrayNodeName: "car",
        ignoreAttributes: true,
        format: true
    });
    const xmlData = builder.build(rootObject);

    res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8' });
    res.end(xmlData);

} catch (error) {
    console.error("Error processing request:", error.message);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end("Internal Server Error: check file format or server configuration.");
}
  });

  server.listen(port, host, () => {
    console.log(`Server running at http://${host}:${port}/`);
  });
}

startServer();
