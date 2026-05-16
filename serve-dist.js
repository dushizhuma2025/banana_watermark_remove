import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const distRoot = resolve('dist');
const port = Number(process.env.PORT) || 4173;

createServer((req, res) => {
  const urlPath = (req.url || '/').split('?')[0];
  const requestPath = urlPath === '/' ? '/dev-preview.html' : urlPath;
  const fsPath = resolve(join(distRoot, normalize(requestPath)));

  if (!fsPath.startsWith(distRoot)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  if (!existsSync(fsPath) || statSync(fsPath).isDirectory()) {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }

  const ext = extname(fsPath).toLowerCase();
  res.writeHead(200, {
    'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  res.end(readFileSync(fsPath));
}).listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));
