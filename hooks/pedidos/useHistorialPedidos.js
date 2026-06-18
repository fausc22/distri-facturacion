// hooks/pedidos/useHistorialPedidos.js — v2: React Query + Zustand (offline preservado)
import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from '@/components/shared/toast';
import { axiosAuth } from '../../utils/apiClient';
import { offlineManager, getAppMode } from '../../utils/offlineManager';
import { useConnectionContext } from '../../context/ConnectionContext';
import { usePedidosUIStore } from '@/stores/pedidosUIStore';
import { usePedidosHistorialQuery } from '@/hooks/queries/finanzasQueries';
import { queryKeys } from '@/hooks/queries/queryKeys';
import { useInvalidateFinanzas } from '@/hooks/queries/useInvalidateQueries';

export function useHistorialPedidos(filtroEmpleado = null) {
  const {
    filtros,
    paginacion,
    setFiltros,
    resetFiltros,
    setPaginacion,
    setLoading,
  } = usePedidosUIStore();

  const queryClient = useQueryClient();
  const { invalidatePedidos } = useInvalidateFinanzas();
  const { modoOffline } = useConnectionContext();
  const isPWA = getAppMode() === 'pwa';
  const offlineMode = modoOffline && isPWA;

  const [selectedPedidos, setSelectedPedidos] = useState([]);
  const [pedidosOffline, setPedidosOffline] = useState([]);
  const [usarSoloRecientes, setUsarSoloRecientes] = useState(true);

  const queryParams = {
    pagina: paginacion.paginaActual,
    porPagina: paginacion.registrosPorPagina,
    filtros,
    empleadoId: filtroEmpleado,
    usarSoloRecientes,
  };

  const query = usePedidosHistorialQuery(queryParams, !offlineMode);

  const cargarPedidosOffline = useCallback(() => {
    const isManager = !filtroEmpleado;
    const pedidos = offlineManager.getPedidosCache({
      empleadoId: filtroEmpleado,
      isManager,
      maxDays: 30,
    });
    setPedidosOffline(pedidos);
  }, [filtroEmpleado]);

  useEffect(() => {
    if (!offlineMode) return;
    cargarPedidosOffline();
    setLoading({ pedidos: false });
  }, [offlineMode, cargarPedidosOffline, setLoading, modoOffline, filtroEmpleado]);

  useEffect(() => {
    if (!offlineMode) {
      setLoading({ pedidos: query.isLoading });
    }
  }, [query.isLoading, offlineMode, setLoading]);

  useEffect(() => {
    if (query.isError && isPWA) {
      const pedidos = offlineManager.getPedidosCache({
        empleadoId: filtroEmpleado,
        isManager: !filtroEmpleado,
        maxDays: 30,
      });
      if (pedidos.length > 0) {
        toast.warning('Mostrando historial offline (últimos 30 días)');
        setPedidosOffline(pedidos);
      } else {
        toast.error('No se pudieron cargar los pedidos');
      }
    }
  }, [query.isError, isPWA, filtroEmpleado]);

  useEffect(() => {
    if (query.data?.pedidos && isPWA) {
      offlineManager.savePedidosCache(query.data.pedidos, 30);
    }
  }, [query.data?.pedidos, isPWA]);

  const pedidosOriginales = offlineMode ? pedidosOffline : (query.data?.pedidos ?? []);
  const totalPedidos = offlineMode ? pedidosOffline.length : (query.data?.total ?? 0);
  const paginaActual = offlineMode
    ? paginacion.paginaActual
    : (query.data?.pagina ?? paginacion.paginaActual);
  const porPagina = offlineMode
    ? paginacion.registrosPorPagina
    : (query.data?.porPagina ?? paginacion.registrosPorPagina);
  const pedidos = pedidosOriginales;
  const loading = offlineMode ? false : query.isLoading;

  const clearSelection = () => setSelectedPedidos([]);

  const handleSelectPedido = (pedidoId) => {
    setSelectedPedidos((prev) =>
      prev.includes(pedidoId) ? prev.filter((id) => id !== pedidoId) : [...prev, pedidoId]
    );
  };

  const handleSelectAllPedidos = (pedidosVisibles) => {
    const todosSeleccionados = pedidosVisibles.every((p) => selectedPedidos.includes(p.id));
    if (todosSeleccionados) {
      setSelectedPedidos((prev) =>
        prev.filter((id) => !pedidosVisibles.some((p) => p.id === id))
      );
    } else {
      const nuevosIds = pedidosVisibles.map((p) => p.id).filter((id) => !selectedPedidos.includes(id));
      setSelectedPedidos((prev) => [...prev, ...nuevosIds]);
    }
  };

  const actualizarFiltros = (nuevosFiltros) => {
    setFiltros(nuevosFiltros);
    setUsarSoloRecientes(false);
    setPaginacion({ paginaActual: 1 });
    clearSelection();
    if (offlineMode) {
      cargarPedidosOffline();
    } else {
      invalidatePedidos();
    }
  };

  const limpiarFiltros = () => {
    resetFiltros();
    setUsarSoloRecientes(false);
    setPaginacion({ paginaActual: 1 });
    clearSelection();
    if (offlineMode) {
      cargarPedidosOffline();
    } else {
      invalidatePedidos();
    }
  };

  const cargarPedidos = async (filtrosParaServidor = null, opts = {}) => {
    const usarTodoElHistorial = opts.usarTodoElHistorial === true;
    if (usarTodoElHistorial) setUsarSoloRecientes(false);

    if (opts.pagina !== undefined || opts.porPagina !== undefined) {
      setPaginacion({
        ...(opts.pagina !== undefined ? { paginaActual: opts.pagina } : {}),
        ...(opts.porPagina !== undefined ? { registrosPorPagina: opts.porPagina } : {}),
      });
    }

    if (filtrosParaServidor) {
      setFiltros(filtrosParaServidor);
    }

    if (offlineMode) {
      cargarPedidosOffline();
      return;
    }

    const result = await query.refetch();
    if (result.isError) {
      toast.error('No se pudieron cargar los pedidos');
    }
    return result;
  };

  const cargarPagina = (numeroPagina, nuevaPorPagina = null) => {
    setPaginacion({
      paginaActual: numeroPagina,
      ...(nuevaPorPagina !== null ? { registrosPorPagina: nuevaPorPagina } : {}),
    });
    if (offlineMode) {
      cargarPedidosOffline();
    }
  };

  const patchPedidosCache = (pedidoId, datosActualizados) => {
    queryClient.setQueryData(queryKeys.pedidos.historial(queryParams), (old) => {
      if (!old) return old;
      return {
        ...old,
        pedidos: old.pedidos.map((p) =>
          p.id === pedidoId ? { ...p, ...datosActualizados } : p
        ),
      };
    });
    setPedidosOffline((prev) =>
      prev.map((p) => (p.id === pedidoId ? { ...p, ...datosActualizados } : p))
    );
  };

  const actualizarPedidoEnLista = (pedidoId, datosActualizados) => {
    patchPedidosCache(pedidoId, datosActualizados);
  };

  const cambiarEstadoMultiple = async (nuevoEstado) => {
    if (selectedPedidos.length === 0) {
      toast.error('No hay pedidos seleccionados');
      return false;
    }

    setLoading({ operacion: true });
    let exitosos = 0;
    let fallidos = 0;

    try {
      for (const pedidoId of selectedPedidos) {
        try {
          const response = await axiosAuth.put(`/pedidos/actualizar-estado/${pedidoId}`, {
            estado: nuevoEstado,
          });
          if (response.data.success) exitosos++;
          else fallidos++;
        } catch {
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
    } catch {
      toast.error('Error al cambiar estado de pedidos');
      return false;
    } finally {
      setLoading({ operacion: false });
    }
  };

  const eliminarMultiple = async () => {
    if (selectedPedidos.length === 0) {
      toast.error('No hay pedidos seleccionados');
      return false;
    }

    setLoading({ operacion: true });
    let exitosos = 0;
    let fallidos = 0;

    try {
      for (const pedidoId of selectedPedidos) {
        try {
          const response = await axiosAuth.delete(`/pedidos/eliminar-pedido/${pedidoId}`);
          if (response.data.success) exitosos++;
          else fallidos++;
        } catch {
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
    } catch {
      toast.error('Error al eliminar pedidos');
      return false;
    } finally {
      setLoading({ operacion: false });
    }
  };

  const getEstadisticas = () => {
    const total = totalPedidos;
    const filtrado = pedidosOriginales.length;
    const exportados = pedidosOriginales.filter((p) => p.estado === 'Exportado').length;
    const facturados = pedidosOriginales.filter((p) => p.estado === 'Facturado').length;
    const anulados = pedidosOriginales.filter((p) => p.estado === 'Anulado').length;
    const totalMonto = pedidosOriginales.reduce((acc, p) => acc + parseFloat(p.total || 0), 0);
    return {
      total,
      filtrado,
      exportados,
      facturados,
      anulados,
      totalMonto: parseFloat(totalMonto.toFixed(2)),
      seleccionados: selectedPedidos.length,
    };
  };

  const hayFiltrosActivos = () => Object.values(filtros).some((valor) => valor && valor !== '');

  return {
    pedidos,
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
    actualizarFiltros,
    limpiarFiltros,
    hayFiltrosActivos,
    cambiarEstadoMultiple,
    eliminarMultiple,
    getEstadisticas,
  };
}