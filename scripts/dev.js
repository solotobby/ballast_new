const { spawn } = require('child_process');
const path = require('path');

console.log('⚓ Starting Ballast System (Backend API + Frontend Design System)...\n');

// 1. Start NestJS Backend
const apiProc = spawn('npx', ['tsx', 'watch', 'src/main.ts'], {
  cwd: path.join(__dirname, '..', 'apps', 'api'),
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PORT: '4000' },
});

// 2. Start Web Server / Reverse Proxy
const webProc = spawn('node', ['server.js'], {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PORT: '3000', API_PORT: '4000' },
});

function cleanup() {
  console.log('\nShutting down Ballast processes...');
  apiProc.kill();
  webProc.kill();
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
