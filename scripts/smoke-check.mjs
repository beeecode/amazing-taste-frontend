import { spawn } from 'node:child_process';
import { once } from 'node:events';

const port = 4287;
const routes = [
  '/',
  '/menu',
  '/checkout',
  '/success',
  '/payment-callback',
  '/payment-callback?reference=SMOKE-REFERENCE',
  '/payment-failed',
  '/admin',
  '/admin/',
  '/admin/login',
  '/admin/login/',
];
const viteBin = 'node_modules/vite/bin/vite.js';

const server = spawn(
  process.execPath,
  [viteBin, '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
  { stdio: ['ignore', 'pipe', 'pipe'] },
);

let stderr = '';
server.stderr.on('data', (chunk) => {
  stderr += chunk.toString();
});

async function waitForServer() {
  const startedAt = Date.now();

  while (Date.now() - startedAt < 15000) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/`);
      if (response.ok) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  throw new Error(`Vite smoke server did not start. ${stderr}`.trim());
}

try {
  await waitForServer();

  for (const route of routes) {
    const response = await fetch(`http://127.0.0.1:${port}${route}`);
    if (!response.ok) {
      throw new Error(`${route} returned ${response.status}`);
    }
  }

  console.log(`Smoke check passed for ${routes.length} routes.`);
} finally {
  server.kill('SIGTERM');
  await Promise.race([
    once(server, 'exit'),
    new Promise((resolve) => setTimeout(resolve, 1500)),
  ]);
}
