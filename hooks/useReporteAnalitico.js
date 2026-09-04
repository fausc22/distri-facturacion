// Datos analíticos compartidos: reporte gerencial + balance financiero.
import { useMemo } from 'react';
import { usePeriodoReportes } from './usePeriodoReportes';
import {
  useReportesGerencialQuery,
  useReportesBalanceQuery,
} from './queries/finanzasQueries';

export function useReporteAnalitico({ incluirBalance = false } = {}) {
  const { rango, filtros, etiquetaPeriodo } = usePeriodoReportes();
  const filtrosPeriodo = useMemo(
    () => ({ desde: rango.desde, hasta: rango.hasta }),
    [rango.desde, rango.hasta]
  );

  const gerencialQuery = useReportesGerencialQuery(filtrosPeriodo, !incluirBalance);
  const balanceQuery = useReportesBalanceQuery(filtrosPeriodo, incluirBalance);

  const balance = useMemo(() => {
    if (!incluirBalance || !balanceQuery.data) {
      return { general: null, porCuenta: null, flujo: null, totales: null };
    }
    return {
      general: balanceQuery.data.balance?.data ?? null,
      porCuenta: balanceQuery.data.cuentas ?? null,
      flujo: balanceQuery.data.flujo?.data ?? null,
      totales: balanceQuery.data.balance?.totales ?? null,
    };
  }, [incluirBalance, balanceQuery.data]);

  const loading = incluirBalance ? balanceQuery.isFetching : gerencialQuery.isFetching;
  const error = incluirBalance
    ? (balanceQuery.error?.message || null)
    : (gerencialQuery.error?.message || null);

  const recargar = () => {
    if (incluirBalance) return balanceQuery.refetch();
    return gerencialQuery.refetch();
  };

  return {
    gerencial: incluirBalance ? null : (gerencialQuery.data ?? null),
    balance,
    loading,
    error,
    rango,
    filtros,
    etiquetaPeriodo,
    recargar,
  };
}

export default useReporteAnalitico;
