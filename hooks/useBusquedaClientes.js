import { useState } from 'react';
import { fetchAuth } from '../utils/apiClient'; 




export function useClienteSearch() {
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const PAGE_SIZE = 10;

  const buscarCliente = async ({ append = false } = {}) => {
    if (!busqueda.trim()) return;

    setLoading(true);
    try {
      const nextOffset = append ? offset : 0;
      const data = await fetchAuth(
        `/pedidos/filtrar-cliente?q=${encodeURIComponent(busqueda)}&limit=${PAGE_SIZE}&offset=${nextOffset}`
      );
      const nuevosResultados = data?.data || [];
      setResultados(prev => (append ? [...prev, ...nuevosResultados] : nuevosResultados));
      setOffset(nextOffset + nuevosResultados.length);
      setHasMore(Boolean(data?.hasMore));
      setMostrarModal(true);
    } catch (error) {
      console.error('Error al buscar cliente:', error);
      if (!append) setResultados([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const cargarMasResultados = async () => {
    if (loading || !hasMore) return;
    await buscarCliente({ append: true });
  };

  const limpiarBusqueda = () => {
    setBusqueda('');
    setResultados([]);
    setMostrarModal(false);
    setOffset(0);
    setHasMore(false);
  };

  return {
    busqueda,
    setBusqueda,
    resultados,
    loading,
    mostrarModal,
    setMostrarModal,
    buscarCliente,
    limpiarBusqueda,
    cargarMasResultados,
    hasMore
  };
}