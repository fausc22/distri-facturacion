#!/usr/bin/env node
import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const devDir = path.join(root, '.next-dev');
const publicDir = path.join(root, 'public');
const port = process.env.PORT || '3000';

function getPortPids(targetPort) {
  try {
    return execSync(`lsof -ti :${targetPort}`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    })
      .trim()
      .split('\n')
      .filter(Boolean);
  } catch {
    return [];
  }
}

function getProcessCommand(pid) {
  try {
    return execSync(`ps -p ${pid} -o args=`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

function isNextDevProcess(command) {
  return /next(\s+dev|\s+start)?|node.*next/.test(command);
}

function killStaleNextOnPort(targetPort) {
  const pids = getPortPids(targetPort);
  let killed = false;

  for (const pid of pids) {
    const command = getProcessCommand(pid);
    if (!isNextDevProcess(command)) continue;

    console.warn(`⚠️  Deteniendo servidor Next previo en :${targetPort} (PID ${pid})`);
    try {
      process.kill(Number(pid), 'SIGTERM');
      killed = true;
    } catch {
      // ignore
    }
  }

  if (killed) {
    execSync('sleep 1');
  }
}

function removePwaArtifacts() {
  if (!fs.existsSync(publicDir)) return;

  for (const file of fs.readdirSync(publicDir)) {
    if (
      file === 'sw.js' ||
      file.startsWith('workbox-') ||
      file.startsWith('fallback-')
    ) {
      fs.unlinkSync(path.join(publicDir, file));
      console.warn(`⚠️  Eliminado artefacto PWA en dev: public/${file}`);
    }
  }
}

function hasTurbopackCache(dir) {
  if (!fs.existsSync(dir)) return false;

  const candidates = [
    path.join(dir, 'static/chunks/pages/finanzas/Listados.js'),
    path.join(dir, 'static/development/_buildManifest.js'),
    path.join(dir, 'server/pages/finanzas/Listados.js'),
  ];

  return candidates.some((filePath) => {
    if (!fs.existsSync(filePath)) return false;
    const sample = fs.readFileSync(filePath, 'utf8').slice(0, 2000);
    return sample.includes('__turbopack') || sample.includes('turbopack');
  });
}

function hasBrokenDevCache() {
  if (!fs.existsSync(devDir)) return false;

  const routesManifest = path.join(devDir, 'routes-manifest.json');
  const serverDir = path.join(devDir, 'server');

  return fs.existsSync(serverDir) && !fs.existsSync(routesManifest);
}

killStaleNextOnPort(port);
removePwaArtifacts();

if (hasTurbopackCache(devDir) || hasBrokenDevCache()) {
  console.warn('⚠️  Caché de desarrollo incompatible (Turbopack o incompleta). Limpiando .next-dev...');
  fs.rmSync(devDir, { recursive: true, force: true });
}

const blockingPids = getPortPids(port).filter((pid) => {
  const command = getProcessCommand(pid);
  return command && !isNextDevProcess(command);
});

if (blockingPids.length > 0) {
  console.error(`\n❌ El puerto ${port} está ocupado por otro proceso (PID: ${blockingPids.join(', ')}).`);
  console.error('   Liberá el puerto o usá PORT=3001 npm run dev\n');
  process.exit(1);
}

const child = spawn('npx', ['next', 'dev', '-p', port], {
  cwd: root,
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'development',
    PORT: port,
  },
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
