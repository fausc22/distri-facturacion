import { useEffect } from 'react';
import toast from '@/components/shared/toast';
import { useComprasHistorialUI } from '@/context/ComprasContext';
import { useProductosCompraQuery } from '@/hooks/queries/finanzasQueries';

export function useDetalleCompra() {
  const {
    detalleCompra,
    setDetalleCompra,
    clearDetalleCompra,
    openModal,
    closeModal,
    setLoading,
  } = useComprasHistorialUI();

  const compraId = detalleCompra.compra?.id;
  const productosQuery = useProductosCompraQuery(compraId, !!compraId);

  useEffect(() => {
    setLoading({ productos: productosQuery.isLoading });
  }, [productosQuery.isLoading, setLoading]);

  useEffect(() => {
    if (productosQuery.isError) {
      toast.error('No se pudieron cargar los productos de la compra');
    }
  }, [productosQuery.isError]);

  const verDetalleCompra = (compra) => {
    setDetalleCompra(compra, []);
    openModal('detalleCompra');
  };

  const cerrarDetalleCompra = () => {
    closeModal('detalleCompra');
    clearDetalleCompra();
  };

  const productos = productosQuery.data ?? detalleCompra.productos ?? [];

  return {
    compra: detalleCompra.compra,
    productos,
    loadingProductos: productosQuery.isLoading,
    verDetalleCompra,
    cerrarDetalleCompra,
  };
}

export function useDetalleGasto() {
  const {
    detalleGasto,
    setDetalleGasto,
    clearDetalleGasto,
    openModal,
    closeModal,
  } = useComprasHistorialUI();

  const verDetalleGasto = (gasto) => {
    setDetalleGasto(gasto);
    openModal('detalleGasto');
  };

  const cerrarDetalleGasto = () => {
    closeModal('detalleGasto');
    clearDetalleGasto();
  };

  return {
    gasto: detalleGasto.gasto,
    verDetalleGasto,
    cerrarDetalleGasto,
  };
}
