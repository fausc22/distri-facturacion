import React, { useEffect, useId } from 'react';
import { useScrollLock } from '../../hooks/shared/useScrollLock';

/**
 * Componente modal base reutilizable
 * @param {boolean} isOpen - Estado de apertura del modal
 * @param {Function} onClose - Callback para cerrar
 * @param {string} title - Título del modal
 * @param {ReactNode} children - Contenido del modal
 * @param {boolean} loading - Estado de carga
 * @param {string} size - Tamaño del modal ('sm', 'md', 'lg', 'xl')
 */
export default function ModalBase({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  loading = false,
  size = 'md',
  closeOnOverlay = false,
  closeOnEscape = false
}) {
  useScrollLock(isOpen);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen || !closeOnEscape) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !loading) {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, loading, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  const handleOverlayClick = (event) => {
    if (closeOnOverlay && !loading && event.target === event.currentTarget) {
      onClose?.();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
    >
      <div
        className={`bg-white rounded-lg p-6 w-full ${sizeClasses[size]} max-h-[min(90dvh,90vh)] overflow-y-auto`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id={titleId} className="text-xl font-bold text-gray-900">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold min-h-[44px] min-w-[44px]"
            disabled={loading}
            aria-label="Cerrar modal"
          >
            ×
          </button>
        </div>
        
        <div>
          {children}
        </div>
      </div>
    </div>
  );
}