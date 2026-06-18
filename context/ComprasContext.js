// context/ComprasContext.js — bridge v2 hacia Zustand
import { useComprasUIStore } from '@/stores/comprasUIStore';

export function CompraProvider({ children }) {
  return children;
}

export function useCompra() {
  const store = useComprasUIStore();
  return {
    proveedor: store.proveedor,
    productos: store.productos,
    total: store.total,
    setProveedor: store.setProveedor,
    clearProveedor: store.clearProveedor,
    addProducto: store.addProducto,
    removeProducto: store.removeProducto,
    updateCantidad: store.updateCantidad,
    clearCompra: store.clearCompra,
  };
}

export function useComprasHistorialUI() {
  const store = useComprasUIStore();
  return {
    vistaActiva: store.vistaActiva,
    setVistaActiva: store.setVistaActiva,
    filtros: store.filtros,
    setFiltros: store.setFiltros,
    resetFiltros: store.resetFiltros,
    mostrarFiltros: store.mostrarFiltros,
    setMostrarFiltros: store.setMostrarFiltros,
    paginacionCompras: store.paginacionCompras,
    paginacionGastos: store.paginacionGastos,
    setPaginacionCompras: store.setPaginacionCompras,
    setPaginacionGastos: store.setPaginacionGastos,
    seleccion: store.seleccion,
    toggleSeleccionCompra: store.toggleSeleccionCompra,
    toggleSeleccionGasto: store.toggleSeleccionGasto,
    setSeleccionCompras: store.setSeleccionCompras,
    setSeleccionGastos: store.setSeleccionGastos,
    clearSeleccion: store.clearSeleccion,
    modales: store.modales,
    setModal: store.setModal,
    openModal: store.openModal,
    closeModal: store.closeModal,
    detalleCompra: store.detalleCompra,
    setDetalleCompra: store.setDetalleCompra,
    clearDetalleCompra: store.clearDetalleCompra,
    detalleGasto: store.detalleGasto,
    setDetalleGasto: store.setDetalleGasto,
    clearDetalleGasto: store.clearDetalleGasto,
    comprobante: store.comprobante,
    setComprobante: store.setComprobante,
    clearComprobante: store.clearComprobante,
    loading: store.loading,
    setLoading: store.setLoading,
  };
}
