/* Static server with HTTP Range support — what video actually needs. */
import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { join, extname, resolve, sep } from 'node:path';

const ROOT = resolve(process.argv[2] || '.');
const PORT = +(process.argv[3] || 8124);

const MIME = {
  '.html': 'text/html;charset=utf-8',
  '.css': 'text/css;charset=utf-8',
  '.js': 'text/javascript;charset=utf-8',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.json': 'application/json',
  '.svg': 'image/svg+xml'
};

createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';

  const file = resolve(join(ROOT, p));
  if (file !== ROOT && !file.startsWith(ROOT + sep)) {
    res.writeHead(403);
    return res.end('403');
  }

  let st;
  try { st = statSync(file); } catch { res.writeHead(404); return res.end('404'); }
  if (st.isDirectory()) { res.writeHead(404); return res.end('404'); }

  const type = MIME[extname(file).toLowerCase()] || 'application/octet-stream';
  const range = req.headers.range;

  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    if (m) {
      const start = m[1] ? +m[1] : 0;
      const end = m[2] ? +m[2] : st.size - 1;
      res.writeHead(206, {
        'Content-Type': type,
        'Accept-Ranges': 'bytes',
        'Content-Range': 'bytes ' + start + '-' + end + '/' + st.size,
        'Content-Length': end - start + 1,
        'Cache-Control': 'no-cache'
      });
      return createReadStream(file, { start, end }).pipe(res);
    }
  }

  res.writeHead(200, {
    'Content-Type': type,
    'Accept-Ranges': 'bytes',
    'Content-Length': st.size,
    'Cache-Control': 'no-cache'
  });
  createReadStream(file).pipe(res);
}).listen(PORT, () => console.log('range-server on ' + PORT + ' root ' + ROOT));
