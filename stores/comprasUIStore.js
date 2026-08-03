import { create } from 'zustand';

const filtrosIniciales = {
  busqueda: '',
  desde: '',
  hasta: '',
};

export const useComprasUIStore = create((set) => ({
  // --- Historial ---
  vistaActiva: 'compras',
  setVistaActiva: (vistaActiva) => set({ vistaActiva }),

  filtros: { ...filtrosIniciales },
  setFiltros: (partial) => set((s) => ({ filtros: { ...s.filtros, ...partial } })),
  resetFiltros: () => set({ filtros: { ...filtrosIniciales } }),

  mostrarFiltros: false,
  setMostrarFiltros: (mostrarFiltros) => set({ mostrarFiltros }),

  paginacionCompras: { paginaActual: 1, registrosPorPagina: 10 },
  paginacionGastos: { paginaActual: 1, registrosPorPagina: 10 },
  setPaginacionCompras: (partial) =>
    set((s) => ({ paginacionCompras: { ...s.paginacionCompras, ...partial } })),
  setPaginacionGastos: (partial) =>
    set((s) => ({ paginacionGastos: { ...s.paginacionGastos, ...partial } })),

  seleccion: { compras: [], gastos: [] },
  toggleSeleccionCompra: (id) =>
    set((s) => ({
      seleccion: {
        ...s.seleccion,
        compras: s.seleccion.compras.includes(id)
          ? s.seleccion.compras.filter((x) => x !== id)
          : [...s.seleccion.compras, id],
      },
    })),
  toggleSeleccionGasto: (id) =>
    set((s) => ({
      seleccion: {
        ...s.seleccion,
        gastos: s.seleccion.gastos.includes(id)
          ? s.seleccion.gastos.filter((x) => x !== id)
          : [...s.seleccion.gastos, id],
      },
    })),
  setSeleccionCompras: (compras) =>
    set((s) => ({ seleccion: { ...s.seleccion, compras } })),
  setSeleccionGastos: (gastos) =>
    set((s) => ({ seleccion: { ...s.seleccion, gastos } })),
  clearSeleccion: () => set({ seleccion: { compras: [], gastos: [] } }),

  modales: {
    detalleCompra: false,
    detalleGasto: false,
    comprobante: false,
    salida: false,
    confirmacionCompra: false,
    salidaCompra: false,
  },
  setModal: (modal, estado) =>
    set((s) => ({ modales: { ...s.modales, [modal]: estado } })),
  openModal: (modal) =>
    set((s) => ({ modales: { ...s.modales, [modal]: true } })),
  closeModal: (modal) =>
    set((s) => ({ modales: { ...s.modales, [modal]: false } })),

  detalleCompra: { compra: null, productos: [] },
  setDetalleCompra: (compra, productos = []) =>
    set({ detalleCompra: { compra, productos } }),
  clearDetalleCompra: () => set({ detalleCompra: { compra: null, productos: [] } }),

  detalleGasto: { gasto: null },
  setDetalleGasto: (gasto) => set({ detalleGasto: { gasto } }),
  clearDetalleGasto: () => set({ detalleGasto: { gasto: null } }),

  comprobante: { tipo: '', id: null },
  setComprobante: (tipo, id) => set({ comprobante: { tipo, id } }),
  clearComprobante: () => set({ comprobante: { tipo: '', id: null } }),

  loading: { compras: false, gastos: false, operacion: false, productos: false },
  setLoading: (partial) =>
    set((s) => ({ loading: { ...s.loading, ...partial } })),

  // --- Registro de compra (carrito) ---
  proveedor: null,
  productos: [],
  total: 0,

  setProveedor: (proveedor) => set({ proveedor }),
  clearProveedor: () => set({ proveedor: null }),

  addProducto: (producto, cantidad, precioCosto, precioVenta, subtotal) =>
    set((s) => {
      const nuevoProducto = {
        id: producto.id,
        nombre: producto.nombre,
        unidad_medida: producto.unidad_medida,
        cantidad,
        precio_costo: precioCosto,
        precio_venta: precioVenta,
        subtotal,
      };
      return {
        productos: [...s.productos, nuevoProducto],
        total: parseFloat((s.total + subtotal).toFixed(2)),
      };
    }),

  removeProducto: (index) =>
    set((s) => {
      const eliminado = s.productos[index];
      if (!eliminado) return s;
      return {
        productos: s.productos.filter((_, i) => i !== index),
        total: parseFloat((s.total - eliminado.subtotal).toFixed(2)),
      };
    }),

  updateCantidad: (index, cantidad) =>
    set((s) => {
      const productos = [...s.productos];
      const producto = productos[index];
      if (!producto) return s;
      const nuevoSubtotal = parseFloat((producto.precio_costo * cantidad).toFixed(2));
      const diferencia = nuevoSubtotal - producto.subtotal;
      productos[index] = { ...producto, cantidad, subtotal: nuevoSubtotal };
      return {
        productos,
        total: parseFloat((s.total + diferencia).toFixed(2)),
      };
    }),

  clearCompra: () => set({ proveedor: null, productos: [], total: 0 }),
}));

export default useComprasUIStore;
