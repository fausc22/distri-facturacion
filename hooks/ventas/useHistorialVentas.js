// hooks/ventas/useHistorialVentas.js - Paginación en servidor. Callbacks estables (Fase 2).
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { axiosAuth } from '../../utils/apiClient';

const POR_PAGINA_DEFAULT = 25;
const DIAS_RECIENTES_DEFAULT = 30;

export function useHistorialVentas() {
  const [ventas, setVentas] = useState([]);
  const [totalVentas, setTotalVentas] = useState(0);
  const [paginaActual, setPaginaActual] = useState(1);
  const [porPagina, setPorPagina] = useState(POR_PAGINA_DEFAULT);
  const [loading, setLoading] = useState(true);
  const [selectedVentas, setSelectedVentas] = useState([]);
  const [ultimosFiltros, setUltimosFiltros] = useState({});
  const [usarSoloRecientes, setUsarSoloRecientes] = useState(true);

  // Refs para leer valor actual sin que cargarVentas/cargarPagina cambien de referencia
  const paginaActualRef = useRef(1);
  const porPaginaRef = useRef(POR_PAGINA_DEFAULT);
  const ultimosFiltrosRef = useRef({});
  const usarSoloRecientesRef = useRef(true);

  useEffect(() => {
    paginaActualRef.current = paginaActual;
    porPaginaRef.current = porPagina;
    ultimosFiltrosRef.current = ultimosFiltros;
    usarSoloRecientesRef.current = usarSoloRecientes;
  }, [paginaActual, porPagina, ultimosFiltros, usarSoloRecientes]);

  const cargarVentas = useCallback(async (opts = {}, options = {}) => {
    const usarTodoElHistorial = options.usarTodoElHistorial === true;
    if (usarTodoElHistorial) setUsarSoloRecientes(false);

    const pagina = opts.pagina !== undefined ? opts.pagina : paginaActualRef.current;
    const porPaginaParam = opts.porPagina !== undefined ? opts.porPagina : porPaginaRef.current;
    const filtros = opts.filtros !== undefined ? opts.filtros : ultimosFiltrosRef.current;
    const soloRecientes = usarTodoElHistorial ? false : usarSoloRecientesRef.current;

    setLoading(true);
    try {
      const params = { pagina, porPagina: porPaginaParam };
      if (!usarTodoElHistorial && soloRecientes) params.dias = DIAS_RECIENTES_DEFAULT;
      if (filtros.cliente) params.cliente = filtros.cliente;
      if (filtros.fechaDesde) params.fechaDesde = filtros.fechaDesde;
      if (filtros.fechaHasta) params.fechaHasta = filtros.fechaHasta;
      if (filtros.tipoDocumento) params.tipoDocumento = filtros.tipoDocumento;
      if (filtros.tipoFiscal) params.tipoFiscal = filtros.tipoFiscal;
      if (filtros.empleado) params.empleado = filtros.empleado;

      const response = await axiosAuth.get('/ventas/obtener-ventas', { params });

      if (response.data && response.data.success) {
        const newPagina = response.data.pagina ?? pagina;
        const newPorPagina = response.data.porPagina ?? porPaginaParam;
        setVentas(response.data.data || []);
        setTotalVentas(response.data.total ?? 0);
        setPaginaActual(newPagina);
        setPorPagina(newPorPagina);
        setUltimosFiltros(filtros);
        paginaActualRef.current = newPagina;
        porPaginaRef.current = newPorPagina;
        ultimosFiltrosRef.current = filtros;
        if (usarTodoElHistorial) usarSoloRecientesRef.current = false;
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
  }, []);

  useEffect(() => {
    cargarVentas({ pagina: 1, porPagina: POR_PAGINA_DEFAULT });
  }, [cargarVentas]);

  const cargarPagina = useCallback((numeroPagina, filtrosActuales, options = {}) => {
    return cargarVentas({
      pagina: numeroPagina,
      porPagina: porPaginaRef.current,
      filtros: filtrosActuales !== undefined ? filtrosActuales : ultimosFiltrosRef.current
    }, options);
  }, [cargarVentas]);

  const handleSelectVenta = useCallback((ventaId) => {
    setSelectedVentas((prev) => {
      if (prev.includes(ventaId)) return prev.filter((id) => id !== ventaId);
      return [...prev, ventaId];
    });
  }, []);

  const handleSelectAllVentas = useCallback((ventasVisibles) => {
    const idsVisibles = ventasVisibles.map((v) => v.id);
    setSelectedVentas((prev) => {
      const todosSeleccionados = idsVisibles.every((id) => prev.includes(id));
      if (todosSeleccionados) return prev.filter((id) => !idsVisibles.includes(id));
      return [...prev, ...idsVisibles.filter((id) => !prev.includes(id))];
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedVentas([]), []);
  const getVentasSeleccionadas = () => ventas.filter((venta) => selectedVentas.includes(venta.id));

  return {
    ventas,
    totalVentas,
    paginaActual,
    porPagina,
    selectedVentas,
    loading,
    usarSoloRecientes,
    diasRecientesDefault: DIAS_RECIENTES_DEFAULT,
    cargarVentas,
    cargarPagina,
    ultimosFiltros,
    handleSelectVenta,
    handleSelectAllVentas,
    clearSelection,
    getVentasSeleccionadas
  };
}
