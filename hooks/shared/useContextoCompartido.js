// hooks/shared/useContextoCompartido.js
import { useContext } from 'react';
import { PedidosContext } from '../../context/PedidosContext';
import { NotasContext } from '../../context/NotasContext';

/**
 * Hook que detecta automáticamente si está dentro de PedidosProvider o NotasProvider
 * y devuelve el contexto correspondiente.
 *
 * Útil para componentes que se reutilizan en ambos contextos.
 *
 * @param {{ required?: boolean }} options
 *   - required: si es false, devuelve null cuando no hay provider (útil con contextAdapter externo)
 */
export function useContextoCompartido(options = {}) {
  const { required = true } = options;

  const notasContext = useContext(NotasContext);
  if (notasContext && notasContext.cliente !== undefined) {
    return notasContext;
  }

  const pedidosContext = useContext(PedidosContext);
  if (pedidosContext && pedidosContext.cliente !== undefined) {
    return pedidosContext;
  }

  if (!required) return null;

  throw new Error('useContextoCompartido debe usarse dentro de PedidosProvider o NotasProvider');
}

