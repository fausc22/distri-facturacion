// hooks/remitos/useRemitos.js - paginación y filtros en servidor
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { axiosAuth } from '../../utils/apiClient';

export const FILTROS_REMITOS_INICIALES = {
  cliente: '',
  ciudad: '',
  provincia: '',
  estado: '',
  empleado: '',
  fechaDesde: '',
  fechaHasta: ''
};

export function useRemitos() {
  const [remitos, setRemitos] = useState([]);
  const [total, setTotal] = useState(0);
  const [selectedRemitos, setSelectedRemitos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);
  const [porPagina, setPorPagina] = useState(10);
  const [filtros, setFiltros] = useState(FILTROS_REMITOS_INICIALES);

  const cargarRemitos = useCallback(async (opciones = {}) => {
    const f = opciones.filtros ?? filtros;
    const pagina = opciones.pagina ?? paginaActual;
    const porPaginaParam = opciones.porPagina ?? porPagina;

    const params = new URLSearchParams();
    params.set('pagina', String(pagina));
    params.set('porPagina', String(porPaginaParam));

    const trim = (v) => (typeof v === 'string' ? v.trim() : '');
    if (trim(f.cliente)) params.set('cliente', trim(f.cliente));
    if (trim(f.ciudad)) params.set('ciudad', trim(f.ciudad));
    if (trim(f.provincia)) params.set('provincia', trim(f.provincia));
    if (trim(f.estado)) params.set('estado', trim(f.estado));
    if (trim(f.empleado)) params.set('empleado', trim(f.empleado));
    if (trim(f.fechaDesde)) params.set('fechaDesde', trim(f.fechaDesde));
    if (trim(f.fechaHasta)) params.set('fechaHasta', trim(f.fechaHasta));

    setLoading(true);
    try {
      const response = await axiosAuth.get(`/productos/obtener-remitos?${params.toString()}`);
      if (response.data.success) {
        const payload = response.data.data || {};
        setRemitos(payload.remitos || []);
        setTotal(payload.total ?? 0);
        setPaginaActual(payload.pagina ?? pagina);
        setPorPagina(payload.porPagina ?? porPaginaParam);
        if (opciones.filtros != null) setFiltros(opciones.filtros);
        return { success: true, data: payload.remitos, total: payload.total };
      }
      toast.error(response.data.message || 'Error al cargar remitos');
      setRemitos([]);
      setTotal(0);
      return { success: false };
    } catch (error) {
      console.error('Error al obtener remitos:', error);
      toast.error('No se pudieron cargar los remitos');
      setRemitos([]);
      setTotal(0);
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [filtros, paginaActual, porPagina]);

  useEffect(() => {
    cargarRemitos();
  }, []);

  const handleSelectRemito = (remitoId) => {
    if (selectedRemitos.includes(remitoId)) {
      setSelectedRemitos(selectedRemitos.filter((id) => id !== remitoId));
    } else {
      setSelectedRemitos([...selectedRemitos, remitoId]);
    }
  };

  const handleSelectAllRemitos = (remitosVisibles) => {
    const idsVisibles = remitosVisibles.map((r) => r.id);
    const todosSeleccionados = idsVisibles.every((id) => selectedRemitos.includes(id));

    if (todosSeleccionados) {
      setSelectedRemitos(selectedRemitos.filter((id) => !idsVisibles.includes(id)));
    } else {
      const nuevosIds = idsVisibles.filter((id) => !selectedRemitos.includes(id));
      setSelectedRemitos([...selectedRemitos, ...nuevosIds]);
    }
  };

  const clearSelection = () => {
    setSelectedRemitos([]);
  };

  const getRemitosSeleccionados = () => {
    return remitos.filter((remito) => selectedRemitos.includes(remito.id));
  };

  return {
    remitos,
    total,
    selectedRemitos,
    loading,
    paginaActual,
    porPagina,
    filtros,
    setFiltros,
    setPaginaActual,
    setPorPagina,
    cargarRemitos,
    handleSelectRemito,
    handleSelectAllRemitos,
    clearSelection,
    getRemitosSeleccionados
  };
}
