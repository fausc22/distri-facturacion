import React from 'react';

/**
 * Componente reutilizable de paginación
 * @param {number} currentPage - Página actual
 * @param {number} totalPages - Total de páginas
 * @param {number} startIndex - Índice de inicio
 * @param {number} itemsPerPage - Items por página
 * @param {number} totalItems - Total de items
 * @param {Function} onPageChange - Callback para cambiar página
 */
export default function Pagination({ 
  currentPage, 
  totalPages, 
  startIndex, 
  itemsPerPage, 
  totalItems,
  onPageChange 
}) {
  if (totalPages <= 1) return null;

  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  return (
    <div className="bg-gray-50 px-4 sm:px-6 py-3 border-t border-gray-200">
      {/* Vista móvil */}
      <div className="flex flex-col sm:hidden space-y-3">
        <p className="text-sm text-gray-700 text-center">
          Página {currentPage} de {totalPages}
        </p>
        <p className="text-xs text-gray-500 text-center">
          {startIndex + 1} a {endIndex} de {totalItems} resultados
        </p>
        <div className="flex justify-center gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex-1 max-w-[120px] px-4 py-3 text-sm bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            ← Anterior
          </button>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex-1 max-w-[120px] px-4 py-3 text-sm bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Siguiente →
          </button>
        </div>
      </div>
      
      {/* Vista desktop */}
      <div className="hidden sm:flex sm:flex-1 sm:justify-between sm:items-center">
        <p className="text-sm text-gray-700">
          Mostrando {startIndex + 1} a {endIndex} de {totalItems} resultados
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Anterior
          </button>
          <span className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md">
            {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}