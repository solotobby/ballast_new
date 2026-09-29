const http = require('http');
const fs = require('fs');
const path = require('path');

const PRIMARY_PORT = parseInt(process.env.PORT || '3000', 10);
const SECONDARY_PORT = parseInt(process.env.SECONDARY_PORT || '8080', 10);
const BACKEND_PORT = parseInt(process.env.API_PORT || '4000', 10);
const PROTOTYPE_DIR = path.join(__dirname, 'ballast-prototype');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp',
};

function proxyApiRequest(req, res) {
  // Strip leading /api prefix: /api/auth/sign-in -> /auth/sign-in
  const backendPath = req.url.replace(/^\/api/, '') || '/';

  const options = {
    hostname: '127.0.0.1',
    port: BACKEND_PORT,
    path: backendPath,
    method: req.method,
    headers: {
      ...req.headers,
      host: `127.0.0.1:${BACKEND_PORT}`,
      'x-forwarded-for': req.socket.remoteAddress,
      'x-forwarded-proto': 'http',
      'x-forwarded-host': req.headers.host || 'localhost:3000',
    },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    // Forward response status & headers
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.warn(`[Proxy Error] Unable to connect to backend on port ${BACKEND_PORT}:`, err.message);
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Backend API unavailable',
      message: 'The Ballast API backend on port 4000 is still starting up or unavailable.',
      code: 'BACKEND_UNAVAILABLE',
    }));
  });

  req.pipe(proxyReq, { end: true });
}

function requestHandler(req, res) {
  // Handle API proxying
  if (req.url.startsWith('/api/') || req.url === '/api') {
    return proxyApiRequest(req, res);
  }

  let reqPath = decodeURIComponent(req.url.split('?')[0]);

  // Strip leading /ballast-prototype if present
  if (reqPath.startsWith('/ballast-prototype/')) {
    reqPath = reqPath.replace(/^\/ballast-prototype/, '');
  } else if (reqPath === '/ballast-prototype') {
    reqPath = '/';
  }

  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  let filePath = path.join(PROTOTYPE_DIR, reqPath);

  // If path is a directory, look for index.html inside it
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  // Fallback to root directory if file not in prototype
  if (!fs.existsSync(filePath)) {
    const rootCandidate = path.join(__dirname, reqPath);
    if (fs.existsSync(rootCandidate) && !fs.statSync(rootCandidate).isDirectory()) {
      filePath = rootCandidate;
    }
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end(`404 Not Found: ${req.url}`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
}

function startServer(port, isPrimary = false) {
  const server = http.createServer(requestHandler);
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[Ballast] Port ${port} is already in use.`);
    } else {
      console.error(`[Ballast] Server error on port ${port}:`, err);
    }
  });

  server.listen(port, () => {
    console.log(`🚀 Ballast running at: http://localhost:${port}`);
    if (isPrimary) {
      console.log(`   Web App:        http://localhost:${port}/pages/login.html`);
      console.log(`   Admin Console:  http://localhost:${port}/platform/login.html`);
      console.log(`   Staff App:      http://localhost:${port}/staff/login.html`);
      console.log(`   API Proxy:      http://localhost:${port}/api -> 127.0.0.1:${BACKEND_PORT}`);
    }
  });

  return server;
}

startServer(PRIMARY_PORT, true);
if (SECONDARY_PORT !== PRIMARY_PORT) {
  startServer(SECONDARY_PORT, false);
}
