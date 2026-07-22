'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' };

http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
  const target = path.resolve(root, `.${pathname}`);
  if (!target.startsWith(root + path.sep) && target !== root) {
    response.writeHead(403).end('Forbidden');
    return;
  }
  fs.readFile(target, (error, data) => {
    if (error) { response.writeHead(404).end('Not found'); return; }
    response.writeHead(200, { 'Content-Type': `${mime[path.extname(target)] || 'application/octet-stream'}; charset=utf-8`, 'Cache-Control': 'no-store' });
    response.end(data);
  });
}).listen(8765, '127.0.0.1');
