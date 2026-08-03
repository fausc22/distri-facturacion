import toast from '@/components/shared/toast';
import { useFondosCuentasQuery } from '@/hooks/queries/finanzasQueries';

export function useCuentasSimple(enabled = true) {
  const query = useFondosCuentasQuery(enabled);

  const cuentas = query.data ?? [];
  const totalSaldos = cuentas.reduce((acc, cuenta) => acc + parseFloat(cuenta.saldo || 0), 0);

  const cargarCuentas = async () => {
    const result = await query.refetch();
    if (result.isError) {
      toast.error('No se pudieron cargar las cuentas');
    }
    return result.data ?? [];
  };

  return {
    cuentas,
    loading: query.isFetching,
    loadingCuentas: query.isLoading,
    totalSaldos,
    cargarCuentas,
  };
}
