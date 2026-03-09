// hooks/ventas/useHistorialVentas.js - Paginación en servidor. Sin parche de 30 días (Fase 2).
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { axiosAuth } from '../../utils/apiClient';

const POR_PAGINA_DEFAULT = 25;

const trim = (v) => (typeof v === 'string' ? v.trim() : v);

export function useHistorialVentas() {
  const [ventas, setVentas] = useState([]);
  const [totalVentas, setTotalVentas] = useState(0);
  const [paginaActual, setPaginaActual] = useState(1);
  const [porPagina, setPorPagina] = useState(POR_PAGINA_DEFAULT);
  const [loading, setLoading] = useState(true);
  const [selectedVentas, setSelectedVentas] = useState([]);
  const [ultimosFiltros, setUltimosFiltros] = useState({});

  const paginaActualRef = useRef(1);
  const porPaginaRef = useRef(POR_PAGINA_DEFAULT);
  const ultimosFiltrosRef = useRef({});

  useEffect(() => {
    paginaActualRef.current = paginaActual;
    porPaginaRef.current = porPagina;
    ultimosFiltrosRef.current = ultimosFiltros;
  }, [paginaActual, porPagina, ultimosFiltros]);

  const cargarVentas = useCallback(async (opts = {}) => {
    const pagina = opts.pagina !== undefined ? opts.pagina : paginaActualRef.current;
    const porPaginaParam = opts.porPagina !== undefined ? opts.porPagina : porPaginaRef.current;
    const filtros = opts.filtros !== undefined ? opts.filtros : ultimosFiltrosRef.current;

    setLoading(true);
    try {
      const params = { pagina, porPagina: porPaginaParam };
      if (trim(filtros.cliente)) params.cliente = trim(filtros.cliente);
      if (trim(filtros.fechaDesde)) params.fechaDesde = trim(filtros.fechaDesde);
      if (trim(filtros.fechaHasta)) params.fechaHasta = trim(filtros.fechaHasta);
      if (trim(filtros.tipoDocumento)) params.tipoDocumento = trim(filtros.tipoDocumento);
      if (trim(filtros.tipoFiscal)) params.tipoFiscal = trim(filtros.tipoFiscal);
      if (trim(filtros.empleado)) params.empleado = trim(filtros.empleado);

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

  const cargarPagina = useCallback((numeroPagina, filtrosActuales) => {
    return cargarVentas({
      pagina: numeroPagina,
      porPagina: porPaginaRef.current,
      filtros: filtrosActuales !== undefined ? filtrosActuales : ultimosFiltrosRef.current
    });
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
    cargarVentas,
    cargarPagina,
    ultimosFiltros,
    handleSelectVenta,
    handleSelectAllVentas,
    clearSelection,
    getVentasSeleccionadas
  };
}
