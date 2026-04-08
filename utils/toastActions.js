/**
 * Fase 2: patrón unificado para feedback — una acción async → un solo toast (loading → éxito/error).
 * Usa la API nativa de react-hot-toast.
 */
import toast from 'react-hot-toast';

/**
 * @param {Promise<T>} promise
 * @param {{ loading?: string, success?: string, error?: string }} [options]
 * @returns {Promise<T>}
 */
export function toastPromise(promise, options = {}) {
  const {
    loading = 'Cargando...',
    success = 'Listo',
    error = 'Error'
  } = options;
  return toast.promise(promise, { loading, success, error });
}

/**
 * Actualiza un toast de progreso existente (mismo id).
 * @param {string} toastId
 * @param {string} message
 */
export function toastProgress(toastId, message) {
  return toast.loading(message, { id: toastId });
}

/**
 * @param {string} [toastId]
 */
export function toastDismiss(toastId) {
  toast.dismiss(toastId);
}
