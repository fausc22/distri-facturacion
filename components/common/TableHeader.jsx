import React from 'react';

/**
 * Componente reutilizable para encabezados de tabla con ordenamiento
 * @param {Array} columns - Array de objetos con estructura: { key, label, sortable, className }
 * @param {string} sortBy - Campo actual de ordenamiento
 * @param {string} sortOrder - Dirección del ordenamiento ('asc' o 'desc')
 * @param {Function} onSort - Función callback para manejar el ordenamiento
 */
export default function TableHeader({ columns, sortBy, sortOrder, onSort }) {
  const handleSort = (key) => {
    if (!key) return;
    onSort(key);
  };

  return (
    <thead className="bg-gray-50">
      <tr>
        {columns.map((column) => (
          <th
            key={column.key}
            className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
              column.sortable ? 'cursor-pointer hover:bg-gray-100 select-none' : ''
            } ${column.className || ''}`}
            onClick={() => column.sortable && handleSort(column.key)}
          >
            <div className="flex items-center gap-2">
              <span>{column.label}</span>
              {column.sortable && (
                <span className="flex flex-col">
                  <svg
                    className={`w-3 h-3 ${
                      sortBy === column.key && sortOrder === 'asc'
                        ? 'text-blue-600'
                        : 'text-gray-400'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </span>
              )}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );
}