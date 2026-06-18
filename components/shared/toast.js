import { toast as hotToast } from 'react-hot-toast';

/**
 * Wrapper unificado de notificaciones v2.
 * Mantiene react-hot-toast como motor (ya configurado en _app.jsx).
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
  promise: (promise, messages, options) => hotToast.promise(promise, messages, options),
};

export default toast;
