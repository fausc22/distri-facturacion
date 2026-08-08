/**
 * Verificación unificada de conectividad backend (PWA offline).
 *
 * Usa /ping (liviano, sin DB) y un fetch simple sin headers custom
 * para evitar preflight CORS frágil en móviles.
 */

export const CONNECTIVITY_STATUS = {
  CONNECTED: 'connected',
  BROWSER_OFFLINE: 'browser_offline',
  TIMEOUT: 'timeout',
  CORS_OR_NETWORK: 'cors_or_network',
  BACKEND_UNAVAILABLE: 'backend_unavailable',
  MISCONFIGURED: 'misconfigured',
};

const PING_FALLBACK_BASE = 'https://api.vertimar.online';
const DEFAULT_TIMEOUT_MS = 10000;

/**
 * Resuelve la URL base de API sin lanzar (seguro para PWA offline).
 * @returns {string|null}
 */
export function resolveApiBaseUrl() {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && typeof envUrl === 'string') {
    return envUrl.replace(/\/+$/, '');
  }
  return PING_FALLBACK_BASE;
}

/**
 * @param {number} [timeoutMs]
 * @returns {Promise<{
 *   ok: boolean,
 *   status: string,
 *   browserOnline: boolean,
 *   url: string|null,
 *   httpStatus?: number,
 *   errorName?: string,
 *   errorMessage?: string,
 * }>}
 */
export async function checkBackendConnectivity(timeoutMs = DEFAULT_TIMEOUT_MS) {
  const browserOnline =
    typeof navigator !== 'undefined' ? Boolean(navigator.onLine) : true;

  // navigator.onLine es solo diagnóstico: NO bloquea el fetch real.
  // En iOS/Android PWA a menudo queda en false tras recuperar Wi‑Fi.
  if (typeof window !== 'undefined' && !browserOnline) {
    console.log(
      '📴 [connectivity] navigator.onLine=false — se intenta /ping de todos modos'
    );
  }

  const apiBase = resolveApiBaseUrl();
  if (!apiBase) {
    return {
      ok: false,
      status: CONNECTIVITY_STATUS.MISCONFIGURED,
      browserOnline,
      url: null,
      errorMessage: 'NEXT_PUBLIC_API_URL no configurada',
    };
  }

  const pingUrl = `${apiBase}/ping?_t=${Date.now()}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // Sin Cache-Control / Pragma / Expires: evitan preflight CORS.
    const response = await fetch(pingUrl, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
      mode: 'cors',
      credentials: 'omit',
      headers: {
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);

    // Cualquier respuesta HTTP demuestra conectividad de red al backend.
    if (response.ok || (response.status >= 400 && response.status < 600)) {
      return {
        ok: true,
        status: CONNECTIVITY_STATUS.CONNECTED,
        browserOnline,
        url: pingUrl,
        httpStatus: response.status,
      };
    }

    return {
      ok: false,
      status: CONNECTIVITY_STATUS.BACKEND_UNAVAILABLE,
      browserOnline,
      url: pingUrl,
      httpStatus: response.status,
    };
  } catch (error) {
    const errorName = error?.name || 'Error';
    const errorMessage = error?.message || String(error);

    if (errorName === 'AbortError') {
      return {
        ok: false,
        status: CONNECTIVITY_STATUS.TIMEOUT,
        browserOnline,
        url: pingUrl,
        errorName,
        errorMessage,
      };
    }

    // TypeError Failed to fetch suele ser CORS, DNS o red.
    return {
      ok: false,
      status: CONNECTIVITY_STATUS.CORS_OR_NETWORK,
      browserOnline,
      url: pingUrl,
      errorName,
      errorMessage,
    };
  }
}

/**
 * Helper booleano compatible con verificadores previos.
 * @param {number} [timeoutMs]
 * @returns {Promise<boolean>}
 */
export async function isBackendReachable(timeoutMs = DEFAULT_TIMEOUT_MS) {
  const result = await checkBackendConnectivity(timeoutMs);
  return result.ok;
}

/**
 * Mensaje de usuario según categoría (sin cambiar UX general).
 * @param {string} status
 * @returns {string}
 */
export function connectivityErrorMessage(status) {
  switch (status) {
    case CONNECTIVITY_STATUS.TIMEOUT:
      return 'Tiempo de espera agotado. Verifique su conexión a internet.';
    case CONNECTIVITY_STATUS.CORS_OR_NETWORK:
      return 'No se pudo reconectar. Verifique su conexión a internet.';
    case CONNECTIVITY_STATUS.BACKEND_UNAVAILABLE:
      return 'El servidor no responde. Intente nuevamente en unos momentos.';
    case CONNECTIVITY_STATUS.MISCONFIGURED:
      return 'Error de configuración de conexión. Contacte soporte.';
    case CONNECTIVITY_STATUS.BROWSER_OFFLINE:
      return 'Sin conexión de red detectada. Verifique Wi‑Fi o datos móviles.';
    default:
      return 'No se pudo reconectar. Verifique su conexión a internet.';
  }
}
