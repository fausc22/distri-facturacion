/**
 * UUID de intención de operación.
 * Se conserva durante reintentos/recargas; una nueva intención genera otra clave.
 * No regenerar automáticamente tras timeout.
 */
const STORAGE_PREFIX = 'vertimar_operacion_id:';

function safeStorage() {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch (_) {
    return null;
  }
}

export function generarOperacionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback RFC4122-ish
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Obtiene o crea el UUID para una intención (ej. 'venta_directa', 'nota_credito').
 * Si forceNew=true, genera una nueva intención.
 */
export function obtenerOperacionId(intencionKey, { forceNew = false } = {}) {
  const key = `${STORAGE_PREFIX}${intencionKey}`;
  const store = safeStorage();
  if (!forceNew && store) {
    const existing = store.getItem(key);
    if (existing && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(existing)) {
      return existing;
    }
  }
  const id = generarOperacionId();
  if (store) store.setItem(key, id);
  return id;
}

/** Liberar la intención tras éxito confirmado (próxima operación = nueva clave). */
export function liberarOperacionId(intencionKey) {
  const store = safeStorage();
  if (!store) return;
  store.removeItem(`${STORAGE_PREFIX}${intencionKey}`);
}
