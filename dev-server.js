// Tiny static server for local testing:  node dev-server.js  →  http://localhost:8123
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const PORT = 8123;
const TYPES = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
};

http.createServer((req, res) => {
  let p = decodeURIComponent(url.parse(req.url).pathname);
  if (p === '/') p = '/index.html';
  const file = path.join(__dirname, p);

  if (!file.startsWith(__dirname)) { res.writeHead(403).end('forbidden'); return; }

  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404).end('not found'); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, () => console.log('EclipseArt dev server on http://localhost:' + PORT));
