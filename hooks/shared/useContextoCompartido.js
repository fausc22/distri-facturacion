// hooks/shared/useContextoCompartido.js
import { useContext } from 'react';
import { PedidosContext } from '../../context/PedidosContext';
import { NotasContext } from '../../context/NotasContext';

/**
 * Hook que detecta automáticamente si está dentro de PedidosProvider o NotasProvider
 * y devuelve el contexto correspondiente.
 * 
 * Útil para componentes que se reutilizan en ambos contextos.
 */
export function useContextoCompartido() {
  // Intentar NotasContext primero
  const notasContext = useContext(NotasContext);
  if (notasContext && notasContext.cliente !== undefined) {
    return notasContext;
  }
  
  // Si no hay NotasContext, intentar PedidosContext
  const pedidosContext = useContext(PedidosContext);
  if (pedidosContext && pedidosContext.cliente !== undefined) {
    return pedidosContext;
  }
  
  throw new Error('useContextoCompartido debe usarse dentro de PedidosProvider o NotasProvider');
}

