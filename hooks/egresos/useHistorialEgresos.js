// hooks/egresos/useHistorialEgresos.js — v2: React Query + Zustand
import { useEffect } from 'react';
import toast from '@/components/shared/toast';
import { useEgresosUIStore } from '@/stores/egresosUIStore';
import { useEgresosHistorialQuery } from '@/hooks/queries/finanzasQueries';
import { useInvalidateFinanzas } from '@/hooks/queries/useInvalidateQueries';

export function useHistorialEgresos() {
  const {
    filtros,
    paginacion,
    setFiltros,
    resetFiltros,
    setPaginacion,
    setLoading,
  } = useEgresosUIStore();

  const { invalidateEgresos } = useInvalidateFinanzas();
  const query = useEgresosHistorialQuery(filtros, paginacion);

  useEffect(() => {
    setLoading({ egresos: query.isLoading });
  }, [query.isLoading, setLoading]);

  const egresos = query.data?.egresos ?? [];
  const totalEgresos = query.data?.total ?? 0;
  const totalRegistros = query.data?.count ?? 0;

  const cargarEgresos = async () => {
    const result = await query.refetch();
    if (result.isError) {
      toast.error('No se pudieron cargar los egresos');
    }
    return result;
  };

  const aplicarFiltros = () => {
    setPaginacion({ paginaActual: 1 });
    invalidateEgresos();
  };

  const limpiarFiltros = () => {
    resetFiltros();
    setPaginacion({ paginaActual: 1 });
    invalidateEgresos();
  };

  const cambiarPagina = (pagina) => {
    setPaginacion({ paginaActual: pagina });
  };

  const cambiarRegistrosPorPagina = (cantidad) => {
    setPaginacion({
      registrosPorPagina: cantidad,
      paginaActual: 1,
    });
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros({ [campo]: valor });
  };

  const totalPaginas = Math.max(
    1,
    Math.ceil(totalRegistros / paginacion.registrosPorPagina)
  );

  return {
    egresos,
    totalEgresos,
    totalRegistros,
    filtros,
    paginacion,
    totalPaginas,
    loading: query.isLoading,
    error: query.isError,
    cargarEgresos,
    aplicarFiltros,
    limpiarFiltros,
    cambiarPagina,
    cambiarRegistrosPorPagina,
    handleFiltroChange,
  };
}
