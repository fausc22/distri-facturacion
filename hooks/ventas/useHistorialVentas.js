// hooks/ventas/useHistorialVentas.js - Paginación en servidor. Por defecto últimos 30 días; al navegar/filtrar: todo el historial.
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { axiosAuth } from '../../utils/apiClient';

const POR_PAGINA_DEFAULT = 50;

export function useHistorialVentas() {
  const [ventas, setVentas] = useState([]);
  const [totalVentas, setTotalVentas] = useState(0);
  const [paginaActual, setPaginaActual] = useState(1);
  const [porPagina, setPorPagina] = useState(POR_PAGINA_DEFAULT);
  const [loading, setLoading] = useState(true);
  const [selectedVentas, setSelectedVentas] = useState([]);
  const [ultimosFiltros, setUltimosFiltros] = useState({});
  const [usarSoloRecientes, setUsarSoloRecientes] = useState(true);

  const cargarVentas = useCallback(async (opts = {}, options = {}) => {
    const usarTodoElHistorial = options.usarTodoElHistorial === true;
    if (usarTodoElHistorial) setUsarSoloRecientes(false);

    const pagina = opts.pagina !== undefined ? opts.pagina : paginaActual;
    const porPaginaParam = opts.porPagina !== undefined ? opts.porPagina : porPagina;
    const filtros = opts.filtros !== undefined ? opts.filtros : ultimosFiltros;

    setLoading(true);
    try {
      const params = { pagina, porPagina: porPaginaParam };
      if (!usarTodoElHistorial && usarSoloRecientes) params.dias = 30;
      if (filtros.cliente) params.cliente = filtros.cliente;
      if (filtros.fechaDesde) params.fechaDesde = filtros.fechaDesde;
      if (filtros.fechaHasta) params.fechaHasta = filtros.fechaHasta;
      if (filtros.tipoDocumento) params.tipoDocumento = filtros.tipoDocumento;
      if (filtros.tipoFiscal) params.tipoFiscal = filtros.tipoFiscal;
      if (filtros.empleado) params.empleado = filtros.empleado;

      const response = await axiosAuth.get('/ventas/obtener-ventas', { params });

      if (response.data && response.data.success) {
        setVentas(response.data.data || []);
        setTotalVentas(response.data.total ?? 0);
        setPaginaActual(response.data.pagina ?? pagina);
        setPorPagina(response.data.porPagina ?? porPaginaParam);
        setUltimosFiltros(filtros);
      } else {
        setVentas([]);
        setTotalVentas(0);
      }
    } catch (error) {
      console.error('Error al obtener ventas:', error);
      toast.error('No se pudieron cargar las ventas');
      setVentas([]);
      setTotalVentas(0);
    } finally {
      setLoading(false);
    }
  }, [paginaActual, porPagina, ultimosFiltros, usarSoloRecientes]);

  useEffect(() => {
    cargarVentas({ pagina: 1, porPagina: POR_PAGINA_DEFAULT });
  }, []);

  const cargarPagina = useCallback((numeroPagina, filtrosActuales, options = {}) => {
    return cargarVentas({
      pagina: numeroPagina,
      porPagina,
      filtros: filtrosActuales !== undefined ? filtrosActuales : ultimosFiltros
    }, options);
  }, [cargarVentas, porPagina, ultimosFiltros]);

  const handleSelectVenta = (ventaId) => {
    if (selectedVentas.includes(ventaId)) {
      setSelectedVentas(selectedVentas.filter(id => id !== ventaId));
    } else {
      setSelectedVentas([...selectedVentas, ventaId]);
    }
  };

  const handleSelectAllVentas = (ventasVisibles) => {
    const idsVisibles = ventasVisibles.map(v => v.id);
    const todosSeleccionados = idsVisibles.every(id => selectedVentas.includes(id));
    if (todosSeleccionados) {
      setSelectedVentas(selectedVentas.filter(id => !idsVisibles.includes(id)));
    } else {
      const nuevosIds = idsVisibles.filter(id => !selectedVentas.includes(id));
      setSelectedVentas([...selectedVentas, ...nuevosIds]);
    }
  };

  const clearSelection = () => setSelectedVentas([]);
  const getVentasSeleccionadas = () => ventas.filter(venta => selectedVentas.includes(venta.id));

  return {
    ventas,
    totalVentas,
    paginaActual,
    porPagina,
    selectedVentas,
    loading,
    usarSoloRecientes,
    cargarVentas,
    cargarPagina,
    ultimosFiltros,
    handleSelectVenta,
    handleSelectAllVentas,
    clearSelection,
    getVentasSeleccionadas
  };
}
