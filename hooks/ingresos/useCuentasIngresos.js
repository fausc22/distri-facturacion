// hooks/ingresos/useCuentasIngresos.js — v2: React Query
import { useIngresosCuentasQuery } from '@/hooks/queries/finanzasQueries';

export function useCuentasIngresos() {
  const { data: cuentas = [], isLoading, refetch } = useIngresosCuentasQuery();

  return {
    cuentas,
    loading: isLoading,
    cargarCuentas: refetch,
  };
}
