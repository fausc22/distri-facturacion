import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/queries/queryKeys';

export function useInvalidateFinanzas() {
  const queryClient = useQueryClient();

  return {
    invalidateIngresos: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.ingresos.all }),
    invalidateEgresos: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.egresos.all }),
    invalidateVentas: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.ventas.all }),
    invalidateFondos: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.fondos.all }),
    invalidateCompras: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.compras.all }),
    invalidatePedidos: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.pedidos.all }),
    invalidateReportes: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.reportes.all }),
  };
}
