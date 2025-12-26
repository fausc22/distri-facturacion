// components/common/VirtualizedTable.jsx - Tabla virtualizada para listas grandes
// ✅ FASE 2: Optimización de rendimiento sin cambiar UI ni comportamiento

import { useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';

/**
 * Componente de tabla virtualizada
 * ✅ Mantiene misma UI y props que tabla normal
 * ✅ Solo se renderizan los items visibles
 * 
 * @param {Array} items - Array de items a mostrar
 * @param {Function} renderRow - Función que renderiza cada fila
 * @param {Object} header - Componente de header (opcional)
 * @param {number} itemHeight - Altura de cada fila en píxeles
 * @param {number} containerHeight - Altura del contenedor en píxeles
 * @param {Object} className - Clases CSS adicionales
 */
export default function VirtualizedTable({
  items = [],
  renderRow,
  header = null,
  itemHeight = 50,
  containerHeight = 600,
  className = '',
  ...props
}) {
  // ✅ Memoizar items para evitar re-renders innecesarios
  const memoizedItems = useMemo(() => items, [items]);

  // ✅ Renderizar fila virtualizada
  const Row = useCallback(({ index, style }) => {
    const item = memoizedItems[index];
    if (!item) return null;
    
    return (
      <div style={style}>
        {renderRow(item, index)}
      </div>
    );
  }, [memoizedItems, renderRow]);

  // ✅ No renderizar si no hay items
  if (!memoizedItems || memoizedItems.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow p-8 text-center text-gray-500 ${className}`}>
        <div className="text-4xl mb-4">📋</div>
        <div className="text-lg font-medium mb-2">No hay datos para mostrar</div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`} {...props}>
      {header && (
        <div className="border-b border-gray-200">
          {header}
        </div>
      )}
      <List
        height={containerHeight}
        itemCount={memoizedItems.length}
        itemSize={itemHeight}
        width="100%"
        overscanCount={5} // Renderizar 5 items extra fuera de vista para scroll suave
      >
        {Row}
      </List>
    </div>
  );
}

/**
 * Hook helper para determinar si usar virtualización
 * Solo virtualiza si hay más de 100 items
 */
export const useShouldVirtualize = (items) => {
  return useMemo(() => {
    return items && items.length > 100;
  }, [items]);
};

