const assert = require('assert');
const path = require('path');
const fs = require('fs');
const vm = require('vm');
const Module = require('module');

function loadEsModuleAsCjs(filePath, exportNames) {
  const code = fs.readFileSync(filePath, 'utf8');
  const transformed = code
    .replace(/export const /g, 'const ')
    .replace(/export function /g, 'function ')
    .concat(`\nmodule.exports = { ${exportNames.join(', ')} };\n`);

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

function run() {
  const {
    decidePedidoSyncOutcome,
    stripLocalPedidoFields,
    PROTECTED_OFFLINE_STORAGE_KEYS,
  } = loadEsModuleAsCjs(path.join(__dirname, 'syncPedidoHelpers.js'), [
    'decidePedidoSyncOutcome',
    'stripLocalPedidoFields',
    'PROTECTED_OFFLINE_STORAGE_KEYS',
  ]);

  // Sync exitoso con pedidoId
  assert.deepStrictEqual(
    decidePedidoSyncOutcome({ success: true, pedidoId: 42 }),
    {
      action: 'remove_synced',
      serverPedidoId: 42,
      message: undefined,
    }
  );

  // Duplicado explícito
  const dup = decidePedidoSyncOutcome({
    success: true,
    existing: true,
    pedidoId: 99,
    message: 'ya registrado',
  });
  assert.strictEqual(dup.action, 'remove_duplicate');
  assert.strictEqual(dup.serverPedidoId, 99);

  // Success ambiguo sin ID → conservar
  const amb = decidePedidoSyncOutcome({ success: true });
  assert.strictEqual(amb.action, 'keep_ambiguous');

  // Stock
  const stock = decidePedidoSyncOutcome({
    success: false,
    message: 'Stock insuficiente para producto X',
  });
  assert.strictEqual(stock.action, 'keep_stock');

  // Error genérico
  const err = decidePedidoSyncOutcome({
    success: false,
    message: 'Cliente inválido',
  });
  assert.strictEqual(err.action, 'keep_error');

  // stripLocalPedidoFields conserva hash
  const { tempId, pedidoData } = stripLocalPedidoFields({
    tempId: 'temp_1',
    fechaCreacion: '2026-01-01',
    estado: 'pendiente_sincronizacion',
    intentos: 1,
    ultimoError: 'x',
    ultimoIntento: 'y',
    hash_pedido: 'abc123',
    cliente_id: 1,
    total: 100,
  });
  assert.strictEqual(tempId, 'temp_1');
  assert.strictEqual(pedidoData.hash_pedido, 'abc123');
  assert.strictEqual(pedidoData.cliente_id, 1);
  assert.ok(!('tempId' in pedidoData));
  assert.ok(!('estado' in pedidoData));

  // Claves protegidas incluyen cola y borrador
  assert.ok(PROTECTED_OFFLINE_STORAGE_KEYS.includes('vertimar_pedidos_pendientes'));
  assert.ok(PROTECTED_OFFLINE_STORAGE_KEYS.includes('vertimar_pedido_estado_completo'));
  assert.ok(PROTECTED_OFFLINE_STORAGE_KEYS.includes('token'));

  console.log('✅ syncPedidoHelpers.test.js: todos los asserts OK');
}

try {
  run();
} catch (err) {
  console.error('❌ syncPedidoHelpers.test.js falló:', err);
  process.exit(1);
}
