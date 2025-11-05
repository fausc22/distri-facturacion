import React from 'react';

/**
 * Componente reutilizable para barra de búsqueda
 * @param {string} value - Valor actual de búsqueda
 * @param {Function} onChange - Callback al cambiar el texto
 * @param {Function} onClear - Callback al limpiar búsqueda
 * @param {string} placeholder - Texto del placeholder
 * @param {boolean} loading - Estado de carga
 * @param {ReactNode} extraButtons - Botones adicionales (ej: "Nuevo Cliente")
 */
export default function SearchBar({ 
  value, 
  onChange, 
  onClear, 
  placeholder = "Buscar...", 
  loading = false,
  extraButtons = null 
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
      <div className="flex-1 w-full relative">
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-2.5 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={loading}
        />
        <svg
          className="absolute left-3 top-3 h-5 w-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      
      <div className="flex items-center gap-2">
        {value && (
          <button
            onClick={onClear}
            className="px-3 py-2 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            disabled={loading}
          >
            Limpiar
          </button>
        )}
        {extraButtons}
      </div>
    </div>
  );
}