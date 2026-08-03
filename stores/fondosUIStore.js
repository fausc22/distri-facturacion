import { create } from 'zustand';

const filtrosIniciales = {
  cuenta_id: 'todas',
  tipo: 'todos',
  desde: '',
  hasta: '',
  busqueda: '',
};

export const useFondosUIStore = create((set) => ({
  vistaActiva: 'cuentas',
  setVistaActiva: (vistaActiva) => set({ vistaActiva }),

  cuentaSeleccionada: null,
  setCuentaSeleccionada: (cuentaSeleccionada) => set({ cuentaSeleccionada }),

  filtros: { ...filtrosIniciales },
  setFiltros: (partial) => set((s) => ({ filtros: { ...s.filtros, ...partial } })),
  resetFiltros: () => set({ filtros: { ...filtrosIniciales } }),

  modales: { cuenta: false, movimiento: false, transferencia: false, detalle: false },
  setModal: (modal, estado) =>
    set((s) => ({ modales: { ...s.modales, [modal]: estado } })),
  openModal: (modal) =>
    set((s) => ({ modales: { ...s.modales, [modal]: true } })),
  closeModal: (modal) =>
    set((s) => ({ modales: { ...s.modales, [modal]: false } })),

  loading: { cuentas: false, movimientos: false, operacion: false },
  setLoading: (partial) =>
    set((s) => ({ loading: { ...s.loading, ...partial } })),
}));

export default useFondosUIStore;
