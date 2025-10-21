const { program } = require('commander');
const http = require('http');
const fs = require('fs');
const path = require('path');

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
  });

  server.listen(port, host, () => {
    console.log(`Server running at http://${host}:${port}/`);
  });
}

startServer();
