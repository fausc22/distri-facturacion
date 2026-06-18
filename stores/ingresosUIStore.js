import { create } from 'zustand';

const filtrosIniciales = {
  desde: '',
  hasta: '',
  tipo: 'todos',
  cuenta: 'todas',
  busqueda: '',
};

export const useIngresosUIStore = create((set) => ({
  filtros: { ...filtrosIniciales },
  setFiltros: (partial) => set((s) => ({ filtros: { ...s.filtros, ...partial } })),
  resetFiltros: () => set({ filtros: { ...filtrosIniciales } }),

  paginacion: { paginaActual: 1, registrosPorPagina: 10 },
  setPaginacion: (partial) =>
    set((s) => ({ paginacion: { ...s.paginacion, ...partial } })),

  mostrarFiltros: false,
  setMostrarFiltros: (mostrarFiltros) => set({ mostrarFiltros }),

  modales: { nuevoIngreso: false, detalle: false },
  setModal: (modal, estado) =>
    set((s) => ({ modales: { ...s.modales, [modal]: estado } })),
  openModal: (modal) =>
    set((s) => ({ modales: { ...s.modales, [modal]: true } })),
  closeModal: (modal) =>
    set((s) => ({ modales: { ...s.modales, [modal]: false } })),

  detalle: { data: null, tipo: '' },
  setDetalle: (data, tipo) => set({ detalle: { data, tipo } }),
  clearDetalle: () => set({ detalle: { data: null, tipo: '' } }),

  loading: { ingresos: false, cuentas: false, operacion: false },
  setLoading: (partial) =>
    set((s) => ({ loading: { ...s.loading, ...partial } })),
}));

export default useIngresosUIStore;
