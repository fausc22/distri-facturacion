import { create } from 'zustand';

const initialFiltros = {
  desde: '',
  hasta: '',
  tipo: 'todos',
  cuenta: 'todas',
  busqueda: '',
};

export const useListadosUIStore = create((set) => ({
  tabActiva: 'libro-iva',
  setTabActiva: (tabActiva) => set({ tabActiva }),

  libroIva: { mes: '', anio: '' },
  setLibroIva: (partial) =>
    set((s) => ({ libroIva: { ...s.libroIva, ...partial } })),

  listadoVendedores: { vendedorId: '', mes: '', anio: '' },
  setListadoVendedores: (partial) =>
    set((s) => ({ listadoVendedores: { ...s.listadoVendedores, ...partial } })),

  listaPrecios: { categoriasSeleccionadas: [] },
  setCategoriasSeleccionadas: (categoriasSeleccionadas) =>
    set({ listaPrecios: { categoriasSeleccionadas } }),
  toggleCategoria: (id) =>
    set((s) => {
      const current = s.listaPrecios.categoriasSeleccionadas;
      const next = current.includes(id)
        ? current.filter((c) => c !== id)
        : [...current, id];
      return { listaPrecios: { categoriasSeleccionadas: next } };
    }),

  controlStock: {
    modoGeneracion: 'seleccion',
    modoSeleccion: 'categorias',
    categoriasSeleccionadas: [],
  },
  setControlStock: (partial) =>
    set((s) => ({ controlStock: { ...s.controlStock, ...partial } })),

  resumenCuenta: { cliente: null },
  setResumenCuentaCliente: (cliente) =>
    set({ resumenCuenta: { cliente } }),
  clearResumenCuentaCliente: () =>
    set({ resumenCuenta: { cliente: null } }),
}));

export default useListadosUIStore;
