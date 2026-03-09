// hooks/pedidos/useHistorialPedidos.js - VERSIÓN COMPLETA ACTUALIZADA
import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { axiosAuth } from '../../utils/apiClient';
import { offlineManager, getAppMode } from '../../utils/offlineManager';
import { useConnectionContext } from '../../context/ConnectionContext';

export function useHistorialPedidos(filtroEmpleado = null) {
  const [pedidosOriginales, setPedidosOriginales] = useState([]); // NUEVO: Pedidos sin filtrar
  const [selectedPedidos, setSelectedPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    estado: '',
    cliente: '',
    ciudad: '',
    empleado: '',
    fechaDesde: '',
    fechaHasta: ''
  });
  const [totalPedidos, setTotalPedidos] = useState(0);
  const [paginaActual, setPaginaActual] = useState(1);
  const [porPagina, setPorPagina] = useState(50);
  const [usarSoloRecientes, setUsarSoloRecientes] = useState(true);
  const { modoOffline } = useConnectionContext();
  const isPWA = getAppMode() === 'pwa';

  const cargarPedidos = async (filtrosParaServidor = null, opts = {}) => {
    const usarTodoElHistorial = opts.usarTodoElHistorial === true;
    const pagina = opts.pagina !== undefined ? opts.pagina : paginaActual;
    const porPaginaParam = opts.porPagina !== undefined ? opts.porPagina : porPagina;
    if (usarTodoElHistorial) setUsarSoloRecientes(false);

    setLoading(true);
    try {
      const isManager = !filtroEmpleado;
      if (modoOffline && isPWA) {
        const pedidosOffline = offlineManager.getPedidosCache({
          empleadoId: filtroEmpleado,
          isManager,
          maxDays: 30
        });
        setPedidosOriginales(pedidosOffline);
        setTotalPedidos(pedidosOffline.length);
        return;
      }

      const params = new URLSearchParams();
      params.set('pagina', String(pagina));
      params.set('porPagina', String(porPaginaParam));
      if (filtroEmpleado) params.set('empleado_id', filtroEmpleado);

      const f = filtrosParaServidor || filtros;
      const trim = (v) => (typeof v === 'string' ? v.trim() : v);
      if (trim(f.fechaDesde)) params.set('fechaDesde', trim(f.fechaDesde));
      if (trim(f.fechaHasta)) params.set('fechaHasta', trim(f.fechaHasta));
      if (trim(f.cliente)) params.set('cliente', trim(f.cliente));
      if (trim(f.estado)) params.set('estado', trim(f.estado));
      if (trim(f.ciudad)) params.set('ciudad', trim(f.ciudad));
      if (trim(f.empleado)) params.set('empleado_nombre', trim(f.empleado));

      if (!usarTodoElHistorial && usarSoloRecientes) {
        params.set('dias', '30');
      }

      const url = `/pedidos/obtener-pedidos?${params.toString()}`;
      const response = await axiosAuth.get(url);

      if (response.data.success) {
        const data = response.data.data || [];
        setPedidosOriginales(data);
        setTotalPedidos(response.data.total ?? 0);
        setPaginaActual(response.data.pagina ?? pagina);
        setPorPagina(response.data.porPagina ?? porPaginaParam);
        if (isPWA) offlineManager.savePedidosCache(data, 30);
      } else {
        toast.error(response.data.message || 'Error al cargar pedidos');
        setPedidosOriginales([]);
        setTotalPedidos(0);
      }
    } catch (error) {
      console.error("❌ Error completo al obtener pedidos:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        fullUrl: error.config?.baseURL + error.config?.url
      });
      if (isPWA) {
        const pedidosOffline = offlineManager.getPedidosCache({
          empleadoId: filtroEmpleado,
          isManager: !filtroEmpleado,
          maxDays: 30
        });
        if (pedidosOffline.length > 0) {
          toast('Mostrando historial offline (últimos 30 días)', { icon: '📴' });
          setPedidosOriginales(pedidosOffline);
          setTotalPedidos(pedidosOffline.length);
        } else {
          toast.error("No se pudieron cargar los pedidos");
          setPedidosOriginales([]);
          setTotalPedidos(0);
        }
      } else {
        toast.error("No se pudieron cargar los pedidos");
        setPedidosOriginales([]);
        setTotalPedidos(0);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPedidos(null, {});
  }, [filtroEmpleado, modoOffline, isPWA]);

  // Búsqueda por cliente en memoria (mismo campo que en servidor)
  const pedidosFiltrados = useMemo(() => {
    if (!pedidosOriginales.length) return pedidosOriginales;
    if (!filtros.cliente || !filtros.cliente.trim()) return pedidosOriginales;
    const texto = filtros.cliente.toLowerCase().trim();
    return pedidosOriginales.filter(p => p.cliente_nombre?.toLowerCase().includes(texto));
  }, [pedidosOriginales, filtros.cliente]);

  // Seleccionar/deseleccionar un pedido individual
  const handleSelectPedido = (pedidoId) => {
    if (selectedPedidos.includes(pedidoId)) {
      setSelectedPedidos(selectedPedidos.filter(id => id !== pedidoId));
    } else {
      setSelectedPedidos([...selectedPedidos, pedidoId]);
    }
  };

  // Seleccionar/deseleccionar todos los pedidos visibles
  const handleSelectAllPedidos = (pedidosVisibles) => {
    const todosSeleccionados = pedidosVisibles.every(p => selectedPedidos.includes(p.id));
    
    if (todosSeleccionados) {
      // Deseleccionar todos los visibles
      setSelectedPedidos(selectedPedidos.filter(id => !pedidosVisibles.some(p => p.id === id)));
    } else {
      // Seleccionar todos los visibles que no estén ya seleccionados
      const nuevosIds = pedidosVisibles.map(p => p.id).filter(id => !selectedPedidos.includes(id));
      setSelectedPedidos([...selectedPedidos, ...nuevosIds]);
    }
  };

  // Limpiar selección
  const clearSelection = () => {
    setSelectedPedidos([]);
  };

  const FILTROS_VACIOS = {
    estado: '',
    cliente: '',
    ciudad: '',
    empleado: '',
    fechaDesde: '',
    fechaHasta: ''
  };

  const actualizarFiltros = (nuevosFiltros) => {
    setFiltros(nuevosFiltros);
    clearSelection();
    // Siempre refetch con los nuevos filtros (también al quitar el último filtro)
    cargarPedidos(nuevosFiltros, { usarTodoElHistorial: true, pagina: 1 });
  };

  const limpiarFiltros = () => {
    setFiltros(FILTROS_VACIOS);
    clearSelection();
    // Pasar filtros vacíos explícitos: cargarPedidos(null) usa el state anterior (aún no actualizado)
    cargarPedidos(FILTROS_VACIOS, { usarTodoElHistorial: true, pagina: 1 });
  };

  const cargarPagina = (numeroPagina, nuevaPorPagina = null) => {
    cargarPedidos(filtros, {
      usarTodoElHistorial: true,
      pagina: numeroPagina,
      porPagina: nuevaPorPagina !== null ? nuevaPorPagina : porPagina
    });
  };

  // Cambiar estado de múltiples pedidos
  const cambiarEstadoMultiple = async (nuevoEstado) => {
    if (selectedPedidos.length === 0) {
      toast.error('No hay pedidos seleccionados');
      return false;
    }

    setLoading(true);
    let exitosos = 0;
    let fallidos = 0;

    try {
      for (const pedidoId of selectedPedidos) {
        try {
          const response = await axiosAuth.put(`/pedidos/actualizar-estado/${pedidoId}`, {
            estado: nuevoEstado
          });
          
          if (response.data.success) {
            exitosos++;
          } else {
            fallidos++;
          }
        } catch (error) {
          console.error(`Error actualizando pedido ${pedidoId}:`, error);
          fallidos++;
        }
      }

      if (exitosos > 0) {
        toast.success(`${exitosos} pedidos actualizados a "${nuevoEstado}"`);
        await cargarPedidos(filtros, { pagina: paginaActual, porPagina });
        clearSelection();
      }
      if (fallidos > 0) toast.error(`${fallidos} pedidos no se pudieron actualizar`);
      return exitosos > 0;
    } catch (error) {
      console.error('Error en cambio masivo de estado:', error);
      toast.error('Error al cambiar estado de pedidos');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Eliminar múltiples pedidos
  const eliminarMultiple = async () => {
    if (selectedPedidos.length === 0) {
      toast.error('No hay pedidos seleccionados');
      return false;
    }

    setLoading(true);
    let exitosos = 0;
    let fallidos = 0;

    try {
      for (const pedidoId of selectedPedidos) {
        try {
          const response = await axiosAuth.delete(`/pedidos/eliminar-pedido/${pedidoId}`);
          
          if (response.data.success) {
            exitosos++;
          } else {
            fallidos++;
          }
        } catch (error) {
          console.error(`Error eliminando pedido ${pedidoId}:`, error);
          fallidos++;
        }
      }

      if (exitosos > 0) {
        toast.success(`${exitosos} pedidos eliminados`);
        await cargarPedidos(filtros, { pagina: paginaActual, porPagina });
        clearSelection();
      }
      if (fallidos > 0) toast.error(`${fallidos} pedidos no se pudieron eliminar`);

      return exitosos > 0;
    } catch (error) {
      console.error('Error en eliminación múltiple:', error);
      toast.error('Error al eliminar pedidos');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getEstadisticas = () => {
    const total = totalPedidos;
    const filtrado = pedidosFiltrados.length;
    const exportados = pedidosFiltrados.filter(p => p.estado === 'Exportado').length;
    const facturados = pedidosFiltrados.filter(p => p.estado === 'Facturado').length;
    const anulados = pedidosFiltrados.filter(p => p.estado === 'Anulado').length;
    const totalMonto = pedidosFiltrados.reduce((acc, p) => acc + parseFloat(p.total || 0), 0);
    return {
      total,
      filtrado,
      exportados,
      facturados,
      anulados,
      totalMonto: parseFloat(totalMonto.toFixed(2)),
      seleccionados: selectedPedidos.length
    };
  };

  // Función para verificar si hay filtros activos
  const hayFiltrosActivos = () => {
    return Object.values(filtros).some(valor => valor && valor !== '');
  };

  /**
   * Actualiza un solo pedido en la lista sin recargar desde el servidor.
   * Usado tras facturar (Fase 1). Reutilizar para anulación u otras actualizaciones
   * puntuales: llamar con el id y { estado: 'Anulado' } (u otros campos) para evitar cargarPedidos().
   */
  const actualizarPedidoEnLista = (pedidoId, datosActualizados) => {
    setPedidosOriginales(prev =>
      prev.map(p => (p.id === pedidoId ? { ...p, ...datosActualizados } : p))
    );
  };

  return {
    pedidos: pedidosFiltrados,
    pedidosOriginales,
    totalPedidos,
    paginaActual,
    porPagina,
    selectedPedidos,
    loading,
    filtros,
    cargarPedidos,
    cargarPagina,
    handleSelectPedido,
    handleSelectAllPedidos,
    clearSelection,
    actualizarPedidoEnLista,

    // Funciones de filtrado
    actualizarFiltros,
    limpiarFiltros,
    hayFiltrosActivos,

    // Operaciones múltiples
    cambiarEstadoMultiple,
    eliminarMultiple,

    // Utilidades
    getEstadisticas
  };
}