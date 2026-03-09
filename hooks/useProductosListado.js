// hooks/useProductosListado.js - Fase 2: listado con paginación y filtros en servidor
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { axiosAuth } from '../utils/apiClient';

export const FILTROS_INICIALES = {
  search: '',
  categoria_id: '',
  unidad_medida: '',
  stock: ''
};

export function useProductosListado() {
  const [productos, setProductos] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
  const [porPagina, setPorPagina] = useState(50);
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);

  const cargarProductos = useCallback(async (opciones = {}) => {
    const f = opciones.filtros ?? filtros;
    const pagina = opciones.pagina ?? paginaActual;
    const porPaginaParam = opciones.porPagina ?? porPagina;

    const params = new URLSearchParams();
    params.set('pagina', String(pagina));
    params.set('porPagina', String(porPaginaParam));
    const trim = (v) => (typeof v === 'string' ? v.trim() : '');
    if (trim(f.search)) params.set('search', trim(f.search));
    if (trim(f.categoria_id)) params.set('categoria_id', trim(f.categoria_id));
    if (trim(f.unidad_medida)) params.set('unidad_medida', trim(f.unidad_medida));
    if (trim(f.stock)) params.set('stock', trim(f.stock));

    setLoading(true);
    try {
      const response = await axiosAuth.get(`/productos/buscar-producto?${params.toString()}`);
      if (response.data.success) {
        setProductos(response.data.data || []);
        setTotal(response.data.total ?? 0);
        setPaginaActual(response.data.pagina ?? pagina);
        setPorPagina(response.data.porPagina ?? porPaginaParam);
        if (opciones.filtros != null) setFiltros(opciones.filtros);
        return { success: true, data: response.data.data, total: response.data.total };
      }
      toast.error(response.data.message || 'Error al cargar productos');
      setProductos([]);
      setTotal(0);
      return { success: false };
    } catch (error) {
      console.error('Error al cargar productos:', error);
      toast.error('Error al cargar productos');
      setProductos([]);
      setTotal(0);
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [filtros, paginaActual, porPagina]);

  useEffect(() => {
    cargarProductos();
  }, []);

  return {
    productos,
    total,
    loading,
    paginaActual,
    porPagina,
    filtros,
    setFiltros,
    setPaginaActual,
    setPorPagina,
    cargarProductos
  };
}
