// hooks/remitos/useFiltrosRemitos.js - estado de filtros (filtrado en servidor)
import { useState } from 'react';
import { FILTROS_REMITOS_INICIALES } from './useRemitos';

export function useFiltrosRemitos(filtrosIniciales = FILTROS_REMITOS_INICIALES) {
  const [filtros, setFiltros] = useState(filtrosIniciales);

  const handleFiltrosChange = (nuevosFiltros) => {
    setFiltros(nuevosFiltros);
  };

  const limpiarFiltros = () => {
    setFiltros({ ...FILTROS_REMITOS_INICIALES });
  };

  return {
    filtros,
    setFiltros,
    handleFiltrosChange,
    limpiarFiltros
  };
}
