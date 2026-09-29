const { createServer } = require('http');
const { readFile } = require('fs/promises');
const { existsSync } = require('fs');
const path = require('path');
const DIST = 'C:\\Users\\Dell\\CascadeProjects\\atlas-of-ages';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (p === '/') p = '/index.html';
  const f = path.join(DIST, p);
  if (!f.startsWith(DIST) || !existsSync(f)) { res.writeHead(404); res.end('x'); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  res.end(await readFile(f));
});
server.listen(8124, () => console.log('Atlas of Ages on http://localhost:8124'));
