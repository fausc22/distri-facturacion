// hooks/ingresos/useHistorialIngresos.js — v2: React Query + Zustand
import { useEffect } from 'react';
import toast from '@/components/shared/toast';
import { useIngresosUIStore } from '@/stores/ingresosUIStore';
import { useIngresosHistorialQuery } from '@/hooks/queries/finanzasQueries';
import { useInvalidateFinanzas } from '@/hooks/queries/useInvalidateQueries';

export function useHistorialIngresos() {
  const {
    filtros,
    paginacion,
    setFiltros,
    resetFiltros,
    setPaginacion,
    setLoading,
  } = useIngresosUIStore();

  const { invalidateIngresos } = useInvalidateFinanzas();

  const query = useIngresosHistorialQuery(filtros, paginacion);

  useEffect(() => {
    setLoading({ ingresos: query.isLoading });
  }, [query.isLoading, setLoading]);

  const ingresos = query.data?.ingresos ?? [];
  const totalIngresos = query.data?.total ?? 0;
  const totalRegistros = query.data?.count ?? 0;

  const cargarIngresos = async () => {
    const result = await query.refetch();
    if (result.isError) {
      toast.error('No se pudieron cargar los ingresos');
    }
    return result;
  };

  const aplicarFiltros = () => {
    setPaginacion({ paginaActual: 1 });
    invalidateIngresos();
  };

  const limpiarFiltros = () => {
    resetFiltros();
    setPaginacion({ paginaActual: 1 });
    invalidateIngresos();
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
    ingresos,
    totalIngresos,
    totalRegistros,
    filtros,
    paginacion,
    totalPaginas,
    loading: query.isLoading,
    error: query.isError,
    cargarIngresos,
    aplicarFiltros,
    limpiarFiltros,
    cambiarPagina,
    cambiarRegistrosPorPagina,
    handleFiltroChange,
  };
}
