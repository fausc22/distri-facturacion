/**
 * Tests unitarios de conectividad PWA (sin framework).
 * Ejecutar: node --experimental-vm-modules utils/connectivity.test.js
 * o: node utils/connectivity.test.mjs via dynamic import shim below.
 *
 * Este archivo usa createRequire + dynamic import del ESM transpiled as CJS via Next.
 * Para máxima portabilidad, duplicamos la lógica de asserts sobre exports vía import dinámico
 * con un pequeño loader CommonJS compatible.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const vm = require('vm');
const Module = require('module');

function loadEsModuleAsCjs(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  // Convertir export simple a module.exports para el test runner Node sin bundler.
  const transformed = code
    .replace(/export const /g, 'const ')
    .replace(/export function /g, 'function ')
    .replace(/export async function /g, 'async function ')
    .concat(`
module.exports = {
  CONNECTIVITY_STATUS,
  resolveApiBaseUrl,
  checkBackendConnectivity,
  isBackendReachable,
  connectivityErrorMessage,
};
`);

  const mod = { exports: {} };
  const dirname = path.dirname(filePath);
  const requireFn = Module.createRequire(filePath);
  const wrapper = vm.runInThisContext(
    `(function (exports, require, module, __filename, __dirname) { ${transformed}\n})`,
    { filename: filePath }
  );
  wrapper(mod.exports, requireFn, mod, filePath, dirname);
  return mod.exports;
}

async function run() {
  const connectivity = loadEsModuleAsCjs(
    path.join(__dirname, 'connectivity.js')
  );

  const {
    CONNECTIVITY_STATUS,
    checkBackendConnectivity,
    isBackendReachable,
    connectivityErrorMessage,
    resolveApiBaseUrl,
  } = connectivity;

  // Mock globals
  global.window = global.window || {};
  global.navigator = { onLine: false };

  let fetchCalls = [];
  global.fetch = async (url, options) => {
    fetchCalls.push({ url, options });
    return {
      ok: true,
      status: 200,
    };
  };

  // 1) navigator.onLine=false NO debe bloquear el fetch
  fetchCalls = [];
  global.navigator.onLine = false;
  process.env.NEXT_PUBLIC_API_URL = 'https://api-v2.vertimar.online';
  const r1 = await checkBackendConnectivity(2000);
  assert.strictEqual(r1.ok, true, 'debe conectar aunque navigator.onLine=false');
  assert.strictEqual(r1.status, CONNECTIVITY_STATUS.CONNECTED);
  assert.strictEqual(fetchCalls.length, 1, 'debe llamar fetch una vez');
  assert.ok(String(fetchCalls[0].url).includes('/ping'), 'debe usar /ping');
  assert.ok(
    !fetchCalls[0].options.headers['Cache-Control'],
    'no debe enviar Cache-Control'
  );
  assert.ok(!fetchCalls[0].options.headers.Pragma, 'no debe enviar Pragma');
  assert.ok(!fetchCalls[0].options.headers.Expires, 'no debe enviar Expires');

  // 2) Timeout
  global.navigator.onLine = true;
  global.fetch = async (_url, options = {}) =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(() => resolve({ ok: true, status: 200 }), 5000);
      if (options.signal) {
        if (options.signal.aborted) {
          clearTimeout(timer);
          const err = new Error('Aborted');
          err.name = 'AbortError';
          reject(err);
          return;
        }
        options.signal.addEventListener('abort', () => {
          clearTimeout(timer);
          const err = new Error('Aborted');
          err.name = 'AbortError';
          reject(err);
        });
      }
    });
  const r2 = await checkBackendConnectivity(50);
  assert.strictEqual(r2.ok, false);
  assert.strictEqual(r2.status, CONNECTIVITY_STATUS.TIMEOUT);

  // 3) CORS / network error
  global.fetch = async () => {
    const err = new TypeError('Failed to fetch');
    throw err;
  };
  const r3 = await checkBackendConnectivity(1000);
  assert.strictEqual(r3.ok, false);
  assert.strictEqual(r3.status, CONNECTIVITY_STATUS.CORS_OR_NETWORK);

  // 4) HTTP 503 cuenta como conectividad (backend responde)
  global.fetch = async () => ({ ok: false, status: 503 });
  const r4 = await checkBackendConnectivity(1000);
  assert.strictEqual(r4.ok, true);
  assert.strictEqual(r4.status, CONNECTIVITY_STATUS.CONNECTED);

  // 5) isBackendReachable wrapper
  global.fetch = async () => ({ ok: true, status: 200 });
  assert.strictEqual(await isBackendReachable(1000), true);

  // 6) resolveApiBaseUrl strip trailing slash
  process.env.NEXT_PUBLIC_API_URL = 'https://api-v2.vertimar.online/';
  assert.strictEqual(resolveApiBaseUrl(), 'https://api-v2.vertimar.online');

  // 7) Mensajes
  assert.ok(connectivityErrorMessage(CONNECTIVITY_STATUS.TIMEOUT).length > 5);
  assert.ok(
    connectivityErrorMessage(CONNECTIVITY_STATUS.CORS_OR_NETWORK).includes(
      'reconectar'
    )
  );

  // 8) Doble clic / llamadas concurrentes no deben interferir
  let concurrent = 0;
  global.fetch = async () => {
    concurrent += 1;
    await new Promise((r) => setTimeout(r, 20));
    return { ok: true, status: 200 };
  };
  const [a, b] = await Promise.all([
    checkBackendConnectivity(1000),
    checkBackendConnectivity(1000),
  ]);
  assert.strictEqual(a.ok, true);
  assert.strictEqual(b.ok, true);
  assert.strictEqual(concurrent, 2);

  console.log('✅ connectivity.test.js: todos los asserts OK');
}

run().catch((err) => {
  console.error('❌ connectivity.test.js falló:', err);
  process.exit(1);
});
