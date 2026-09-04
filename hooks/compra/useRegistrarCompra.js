import toast from '@/components/shared/toast';
import { useQueryClient } from '@tanstack/react-query';
import { useComprasUIStore } from '@/stores/comprasUIStore';
import { useRegistrarCompraMutation } from '@/hooks/queries/finanzasQueries';
import { useInvalidateFinanzas } from '@/hooks/queries/useInvalidateQueries';

export function useRegistrarCompra() {
  const setLoading = useComprasUIStore((s) => s.setLoading);
  const mutation = useRegistrarCompraMutation();
  const { invalidateCompras, invalidateFondos } = useInvalidateFinanzas();
  const queryClient = useQueryClient();

  const registrarCompra = async (datosCompraCompletos) => {
    const {
      proveedor_id,
      proveedor_nombre,
      proveedor_cuit,
      productos,
      total,
      subtotal,
      iva_total,
      cuentaId,
      actualizarStock = true,
      observaciones = '',
    } = datosCompraCompletos;

    if (!proveedor_id || productos.length === 0) {
      toast.error('Debe seleccionar un proveedor y agregar al menos un producto.');
      return { success: false };
    }

    if (!cuentaId) {
      toast.error('Debe seleccionar una cuenta de origen para el egreso.');
      return { success: false };
    }

    setLoading({ operacion: true });
    try {
      const compraData = {
        proveedor_id,
        proveedor_nombre,
        proveedor_cuit,
        total: Number(total).toFixed(2),
        subtotal: Number(subtotal).toFixed(2),
        iva_total: Number(iva_total).toFixed(2),
        fecha: new Date().toISOString().slice(0, 10),
        productos,
        cuentaId,
        actualizarStock,
        observaciones: observaciones || 'Compra registrada desde sistema',
      };

      const response = await mutation.mutateAsync(compraData);
      invalidateCompras();
      invalidateFondos();
      if (actualizarStock) {
        queryClient.invalidateQueries({ queryKey: ['productos'] });
      }
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.message || 'Error al registrar la compra';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading({ operacion: false });
    }
  };

  return {
    registrarCompra,
    loading: mutation.isPending,
  };
}
