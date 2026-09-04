import { toast as hotToast } from 'react-hot-toast';

/**
 * IDs fijos para toasts globales que NO deben apilarse.
 * react-hot-toast reemplaza un toast existente si se usa el mismo id.
 */
const TOAST_IDS = {
  AUTH_ERROR: 'toast-auth-error',
  NETWORK_ERROR: 'toast-network-error',
  OFFLINE: 'toast-offline',
  RECONNECTED: 'toast-reconnected',
};

/**
 * Wrapper unificado de notificaciones.
 * Mantiene react-hot-toast como motor (ya configurado en _app.jsx).
 *
 * Reglas de uso:
 * - Errores de sesión/auth → toast.authError(msg)    [deduplicado globalmente]
 * - Errores de red genéricos → toast.networkError()  [deduplicado globalmente]
 * - Resto de errores → toast.error(msg)
 */
export const toast = {
  success: (message, options) => hotToast.success(message, options),

  error: (message, options) => hotToast.error(message, options),

  warning: (message, options) =>
    hotToast(message, { ...options, icon: options?.icon ?? '⚠️' }),

  info: (message, options) =>
    hotToast(message, { ...options, icon: options?.icon ?? 'ℹ️' }),

  loading: (message, options) => hotToast.loading(message, options),

  dismiss: (id) => hotToast.dismiss(id),

  promise: (promise, messages, options) =>
    hotToast.promise(promise, messages, options),

  /** Toast de sesión expirada — nunca se apila, reemplaza al anterior */
  authError: (message = 'Sesión expirada. Por favor, inicie sesión nuevamente.') =>
    hotToast.error(message, { id: TOAST_IDS.AUTH_ERROR, duration: 4000 }),

  /** Toast de error de red puro — nunca se apila */
  networkError: (message = 'Sin respuesta del servidor. Verifique su conexión.') =>
    hotToast.error(message, { id: TOAST_IDS.NETWORK_ERROR, duration: 4000 }),
};

export { TOAST_IDS };
export default toast;
