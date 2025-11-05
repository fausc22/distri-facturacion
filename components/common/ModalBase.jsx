import React from 'react';

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
  size = 'md' 
}) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-lg p-6 w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            disabled={loading}
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