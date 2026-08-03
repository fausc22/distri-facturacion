import { create } from 'zustand';

const filtrosIniciales = {
  estado: '',
  cliente: '',
  ciudad: '',
  empleado: '',
  fechaDesde: '',
  fechaHasta: '',
};

const initialModales = {
  confirmacionPedido: false,
  confirmacionSalida: false,
  detalle: false,
  agregarProducto: false,
  editarProducto: false,
  eliminarProducto: false,
  confirmacionSalidaHistorial: false,
  anularPedido: false,
  facturacion: false,
  cambioEstado: false,
  eliminarMultiple: false,
};

export const usePedidosUIStore = create((set, get) => ({
  filtros: { ...filtrosIniciales },
  setFiltros: (partial) => set((s) => ({ filtros: { ...s.filtros, ...partial } })),
  resetFiltros: () => set({ filtros: { ...filtrosIniciales } }),

  paginacion: { paginaActual: 1, registrosPorPagina: 50 },
  setPaginacion: (partial) =>
    set((s) => ({ paginacion: { ...s.paginacion, ...partial } })),

  mostrarFiltros: false,
  setMostrarFiltros: (mostrarFiltros) => set({ mostrarFiltros }),
  toggleFiltros: () => set((s) => ({ mostrarFiltros: !s.mostrarFiltros })),

  modalFiltros: false,
  setModalFiltros: (modalFiltros) => set({ modalFiltros }),
  openModalFiltros: () => set({ modalFiltros: true }),
  closeModalFiltros: () => set({ modalFiltros: false }),

  modales: { ...initialModales },
  openModal: (modal) =>
    set((s) => ({ modales: { ...s.modales, [modal]: true } })),
  closeModal: (modal) =>
    set((s) => ({ modales: { ...s.modales, [modal]: false } })),
  closeAllModales: () => set({ modales: { ...initialModales } }),
  isModalOpen: (modal) => Boolean(get().modales[modal]),

  banners: { offlineReconnect: true },
  setBanner: (banner, visible) =>
    set((s) => ({ banners: { ...s.banners, [banner]: visible } })),

  productoEditando: null,
  setProductoEditando: (productoEditando) => set({ productoEditando }),
  productoEliminando: null,
  setProductoEliminando: (productoEliminando) => set({ productoEliminando }),
  pedidoParaAnular: null,
  setPedidoParaAnular: (pedidoParaAnular) => set({ pedidoParaAnular }),

  loading: { pedidos: false, operacion: false },
  setLoading: (partial) =>
    set((s) => ({ loading: { ...s.loading, ...partial } })),
}));

export default usePedidosUIStore;
