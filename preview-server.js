/* ================================================================
   本地预览服务器（无需任何依赖）
   启动：在项目文件夹执行  node preview-server.js
   然后浏览器打开 http://localhost:8088
   用途：预览 index.html 及 images / audio 里的照片与音乐
   ================================================================ */
const http = require('http'), fs = require('fs'), path = require('path');
const root = __dirname;
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.jfif': 'image/jpeg',
  '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.wav': 'audio/wav', '.ogg': 'audio/ogg',
  '.mp4': 'video/mp4'
};
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const f = path.normalize(path.join(root, p));
  if (!f.startsWith(root)) { res.writeHead(403); return res.end(); }
  const stat = fs.statSync(f, { throwIfNoEntry: false });
  if (!stat || !stat.isFile()) { res.writeHead(404); return res.end('404'); }
  const type = mime[path.extname(f).toLowerCase()] || 'application/octet-stream';
  /* 支持 Range 请求（音乐拖动进度需要） */
  const range = req.headers.range;
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    const start = m && m[1] ? parseInt(m[1]) : 0;
    const end = m && m[2] ? parseInt(m[2]) : stat.size - 1;
    if (start >= stat.size) { res.writeHead(416); return res.end(); }
    res.writeHead(206, {
      'Content-Type': type, 'Accept-Ranges': 'bytes',
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Content-Length': end - start + 1
    });
    fs.createReadStream(f, { start, end }).pipe(res);
  } else {
    res.writeHead(200, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Length': stat.size });
    fs.createReadStream(f).pipe(res);
  }
}).listen(8088, () => console.log('preview: http://localhost:8088'));
