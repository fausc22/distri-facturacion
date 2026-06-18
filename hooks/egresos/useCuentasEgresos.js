// hooks/egresos/useCuentasEgresos.js — v2: React Query
import { useEgresosCuentasQuery } from '@/hooks/queries/finanzasQueries';

export function useCuentasEgresos() {
  const { data: cuentas = [], isLoading, refetch } = useEgresosCuentasQuery();

  return {
    cuentas,
    loading: isLoading,
    cargarCuentas: refetch,
  };
}
