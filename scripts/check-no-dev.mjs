#!/usr/bin/env node
import { execSync } from 'node:child_process';

const port = process.env.PORT || '3000';

try {
  const pids = execSync(`lsof -ti :${port}`, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'ignore'],
  }).trim();

  if (pids) {
    console.error('\n❌ Hay un servidor en el puerto', port, `(PID: ${pids.replace(/\n/g, ', ')})`);
    console.error('   Detené `npm run dev` antes de ejecutar `npm run build`.');
    console.error('   Si corrés build con dev activo, Next corrompe los manifests.\n');
    process.exit(1);
  }
} catch {
  // Puerto libre
}
