import { useEffect, useMemo } from 'react';
import toast from '@/components/shared/toast';
import { useComprasHistorialUI } from '@/context/ComprasContext';
import {
  useComprasHistorialQuery,
  useGastosHistorialQuery,
} from '@/hooks/queries/finanzasQueries';
import { useInvalidateFinanzas } from '@/hooks/queries/useInvalidateQueries';

function filtrarRegistros(registros, filtros) {
  if (!filtros.busqueda?.trim()) return registros;
  const term = filtros.busqueda.toLowerCase().trim();
  return registros.filter((item) =>
    Object.values(item).some((v) => v?.toString().toLowerCase().includes(term))
  );
}

export function useHistorialCompras() {
  const {
    filtros,
    paginacionCompras,
    paginacionGastos,
    setPaginacionCompras,
    setPaginacionGastos,
    setLoading,
    resetFiltros,
    setFiltros,
  } = useComprasHistorialUI();

  const { invalidateCompras } = useInvalidateFinanzas();

  const comprasQuery = useComprasHistorialQuery();
  const gastosQuery = useGastosHistorialQuery();

  useEffect(() => {
    setLoading({
      compras: comprasQuery.isLoading,
      gastos: gastosQuery.isLoading,
    });
  }, [comprasQuery.isLoading, gastosQuery.isLoading, setLoading]);

  const comprasFiltradas = useMemo(
    () => filtrarRegistros(comprasQuery.data ?? [], filtros),
    [comprasQuery.data, filtros]
  );

  const gastosFiltrados = useMemo(
    () => filtrarRegistros(gastosQuery.data ?? [], filtros),
    [gastosQuery.data, filtros]
  );

  const totalPaginasCompras = Math.max(
    1,
    Math.ceil(comprasFiltradas.length / paginacionCompras.registrosPorPagina)
  );

  const totalPaginasGastos = Math.max(
    1,
    Math.ceil(gastosFiltrados.length / paginacionGastos.registrosPorPagina)
  );

  const indexOfPrimeroCompras =
    (paginacionCompras.paginaActual - 1) * paginacionCompras.registrosPorPagina;
  const indexOfUltimoCompras = indexOfPrimeroCompras + paginacionCompras.registrosPorPagina;

  const indexOfPrimeroGastos =
    (paginacionGastos.paginaActual - 1) * paginacionGastos.registrosPorPagina;
  const indexOfUltimoGastos = indexOfPrimeroGastos + paginacionGastos.registrosPorPagina;

  const comprasPagina = comprasFiltradas.slice(indexOfPrimeroCompras, indexOfUltimoCompras);
  const gastosPagina = gastosFiltrados.slice(indexOfPrimeroGastos, indexOfUltimoGastos);

  const cargarDatos = async () => {
    const [comprasResult, gastosResult] = await Promise.all([
      comprasQuery.refetch(),
      gastosQuery.refetch(),
    ]);
    if (comprasResult.isError || gastosResult.isError) {
      toast.error('No se pudieron actualizar los datos');
    }
    return { comprasResult, gastosResult };
  };

  const aplicarFiltros = () => {
    setPaginacionCompras({ paginaActual: 1 });
    setPaginacionGastos({ paginaActual: 1 });
    invalidateCompras();
  };

  const limpiarFiltros = () => {
    resetFiltros();
    setPaginacionCompras({ paginaActual: 1 });
    setPaginacionGastos({ paginaActual: 1 });
    invalidateCompras();
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros({ [campo]: valor });
  };

  return {
    compras: comprasPagina,
    gastos: gastosPagina,
    totalCompras: comprasFiltradas.length,
    totalGastos: gastosFiltrados.length,
    comprasFiltradas,
    gastosFiltrados,
    filtros,
    paginacionCompras,
    paginacionGastos,
    totalPaginasCompras,
    totalPaginasGastos,
    indexOfPrimeroCompras,
    indexOfUltimoCompras: Math.min(indexOfUltimoCompras, comprasFiltradas.length),
    indexOfPrimeroGastos,
    indexOfUltimoGastos: Math.min(indexOfUltimoGastos, gastosFiltrados.length),
    loadingCompras: comprasQuery.isLoading,
    loadingGastos: gastosQuery.isLoading,
    cargarDatos,
    aplicarFiltros,
    limpiarFiltros,
    handleFiltroChange,
    cambiarPaginaCompras: (pagina) => setPaginacionCompras({ paginaActual: pagina }),
    cambiarPaginaGastos: (pagina) => setPaginacionGastos({ paginaActual: pagina }),
    cambiarRegistrosPorPaginaCompras: (cantidad) =>
      setPaginacionCompras({ registrosPorPagina: cantidad, paginaActual: 1 }),
    cambiarRegistrosPorPaginaGastos: (cantidad) =>
      setPaginacionGastos({ registrosPorPagina: cantidad, paginaActual: 1 }),
  };
}
