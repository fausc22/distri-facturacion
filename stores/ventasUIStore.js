import { create } from 'zustand';

const initialModales = {
  detalle: false,
  comprobante: false,
  confirmacionSalida: false,
  notaDebito: false,
  notaCredito: false,
};

export const useVentasUIStore = create((set, get) => ({
  modales: { ...initialModales },
  openModal: (modal) =>
    set((s) => ({ modales: { ...s.modales, [modal]: true } })),
  closeModal: (modal) =>
    set((s) => ({ modales: { ...s.modales, [modal]: false } })),
  closeAllModales: () => set({ modales: { ...initialModales } }),
  isModalOpen: (modal) => Boolean(get().modales[modal]),

  ventasDesdeBackend: null,
  setVentasDesdeBackend: (ventasDesdeBackend) => set({ ventasDesdeBackend }),

  mostrarFiltros: false,
  setMostrarFiltros: (mostrarFiltros) => set({ mostrarFiltros }),
  toggleFiltros: () => set((s) => ({ mostrarFiltros: !s.mostrarFiltros })),
}));

export default useVentasUIStore;
