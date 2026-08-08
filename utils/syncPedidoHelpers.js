/**
 * Decisiones puras de sync offline (testeable sin React).
 * Regla: solo eliminar local si hay confirmación de servidor o duplicado explícito.
 */

/**
 * @param {{ success?: boolean, existing?: boolean, pedidoId?: number|string|null, data?: { id?: number|string }, id?: number|string, message?: string }} responseData
 * @returns {{ action: 'remove_synced'|'remove_duplicate'|'keep_ambiguous'|'keep_error'|'keep_stock', serverPedidoId: number|string|null, message?: string }}
 */
export function decidePedidoSyncOutcome(responseData = {}) {
  const serverPedidoId =
    responseData.pedidoId ??
    responseData.data?.id ??
    responseData.id ??
    null;

  if (responseData.success && responseData.existing) {
    return {
      action: 'remove_duplicate',
      serverPedidoId,
      message: responseData.message,
    };
  }

  if (responseData.success && serverPedidoId) {
    return {
      action: 'remove_synced',
      serverPedidoId,
      message: responseData.message,
    };
  }

  if (responseData.success && !serverPedidoId) {
    return {
      action: 'keep_ambiguous',
      serverPedidoId: null,
      message: 'Respuesta incompleta del servidor',
    };
  }

  const message = responseData.message || 'Error del servidor';
  if (typeof message === 'string' && message.includes('Stock insuficiente')) {
    return {
      action: 'keep_stock',
      serverPedidoId: null,
      message,
    };
  }

  return {
    action: 'keep_error',
    serverPedidoId: null,
    message,
  };
}

/**
 * Campos locales que nunca deben enviarse al backend.
 * hash_pedido SIEMPRE se conserva en el payload.
 */
export function stripLocalPedidoFields(pedido = {}) {
  const {
    tempId,
    fechaCreacion,
    estado,
    intentos,
    ultimoError,
    ultimoIntento,
    ...pedidoData
  } = pedido;

  if (!pedidoData.hash_pedido && pedido.hash_pedido) {
    pedidoData.hash_pedido = pedido.hash_pedido;
  }

  return { tempId, pedidoData };
}

/** Claves de datos offline que NUNCA deben borrarse al actualizar SW/caché. */
export const PROTECTED_OFFLINE_STORAGE_KEYS = [
  'vertimar_pedidos_pendientes',
  'vertimar_pedido_estado_completo',
  'vertimar_clientes_offline',
  'vertimar_productos_offline',
  'vertimar_pedidos_cache',
  'vertimar_pedidos_productos_cache',
  'vertimar_last_sync',
  'vertimar_catalog_version',
  'vertimar_modo_offline_forzado',
  'token',
  'refreshToken',
  'empleado',
  'role',
  'tokenExpiry',
  'refreshTokenExpiry',
  'hasRefreshToken',
];
