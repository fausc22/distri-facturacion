import { create } from 'zustand';
import { toast } from 'react-hot-toast';

const pad2 = (n) => String(n).padStart(2, '0');

const primerDiaMes = (anio, mes) => `${anio}-${pad2(mes)}-01`;

const ultimoDiaMes = (anio, mes) => {
  const ultimo = new Date(anio, mes, 0);
  return `${ultimo.getFullYear()}-${pad2(ultimo.getMonth() + 1)}-${pad2(ultimo.getDate())}`;
};

const construirRangoDesdeEstado = (modoPeriodo, seleccionMes, seleccionRango) => {
  if (modoPeriodo === 'rango') {
    const ini = new Date(seleccionRango.desdeAnio, seleccionRango.desdeMes - 1, 1);
    const fin = new Date(seleccionRango.hastaAnio, seleccionRango.hastaMes - 1, 1);
    if (ini > fin) {
      return {
        desde: primerDiaMes(seleccionRango.hastaAnio, seleccionRango.hastaMes),
        hasta: ultimoDiaMes(seleccionRango.desdeAnio, seleccionRango.desdeMes),
      };
    }
    return {
      desde: primerDiaMes(seleccionRango.desdeAnio, seleccionRango.desdeMes),
      hasta: ultimoDiaMes(seleccionRango.hastaAnio, seleccionRango.hastaMes),
    };
  }
  return {
    desde: primerDiaMes(seleccionMes.anio, seleccionMes.mes),
    hasta: ultimoDiaMes(seleccionMes.anio, seleccionMes.mes),
  };
};

function getDefaultPeriodo() {
  const hoy = new Date();
  return {
    modoPeriodo: 'mes',
    seleccionMes: { anio: hoy.getFullYear(), mes: hoy.getMonth() + 1 },
    seleccionRango: {
      desdeAnio: hoy.getFullYear(),
      desdeMes: 1,
      hastaAnio: hoy.getFullYear(),
      hastaMes: hoy.getMonth() + 1,
    },
  };
}

function getDefaultFiltros() {
  const periodo = getDefaultPeriodo();
  const rango = construirRangoDesdeEstado(
    periodo.modoPeriodo,
    periodo.seleccionMes,
    periodo.seleccionRango
  );
  return {
    ...rango,
    periodo: 'mensual',
    empleado_id: '',
    ciudad: '',
    cuenta_id: '',
    tipo_fiscal: '',
    comparativo: 'periodo_anterior',
    limite: 50,
  };
}

const sincronizarFiltrosConRango = (state) => {
  const rango = construirRangoDesdeEstado(
    state.modoPeriodo,
    state.seleccionMes,
    state.seleccionRango
  );
  return {
    ...state,
    rango,
    filtros: { ...state.filtros, ...rango },
  };
};

export const PERIODOS_PREDEFINIDOS = [
  { key: 'hoy', label: 'Hoy', periodo: 'diario' },
  { key: 'mes', label: 'Mes actual', periodo: 'diario' },
  { key: 'trimestre', label: 'Último trimestre', periodo: 'mensual' },
  { key: 'año', label: 'Últimos 6 meses', periodo: 'mensual' },
];

export function formatearPeriodoReporte(desde, hasta) {
  if (!desde || !hasta) return 'Período no definido';
  const fechaDesde = new Date(desde);
  const fechaHasta = new Date(hasta);
  const opciones = { year: 'numeric', month: 'short', day: 'numeric' };
  return `${fechaDesde.toLocaleDateString('es-AR', opciones)} - ${fechaHasta.toLocaleDateString('es-AR', opciones)}`;
}

export function getReportesComputed(filtros) {
  const isPeriodoValido =
    Boolean(filtros.desde && filtros.hasta) &&
    new Date(filtros.desde) <= new Date(filtros.hasta);

  let diasEnPeriodo = 0;
  if (isPeriodoValido) {
    const desde = new Date(filtros.desde);
    const hasta = new Date(filtros.hasta);
    diasEnPeriodo = Math.ceil((hasta.getTime() - desde.getTime()) / (1000 * 3600 * 24)) + 1;
  }

  return {
    isPeriodoValido,
    diasEnPeriodo,
    formatearPeriodo: formatearPeriodoReporte(filtros.desde, filtros.hasta),
    periodosPredefinidos: PERIODOS_PREDEFINIDOS,
  };
}

const periodoInicial = getDefaultPeriodo();
const rangoInicial = construirRangoDesdeEstado(
  periodoInicial.modoPeriodo,
  periodoInicial.seleccionMes,
  periodoInicial.seleccionRango
);

export const useReportesUIStore = create((set, get) => ({
  tabActiva: 'gerencial',
  setTabActiva: (tabActiva) => set({ tabActiva }),

  ...periodoInicial,
  rango: rangoInicial,
  filtros: getDefaultFiltros(),

  setModoPeriodo: (modoPeriodo) =>
    set((s) => sincronizarFiltrosConRango({ ...s, modoPeriodo })),

  setSeleccionMes: (seleccionMes) =>
    set((s) => sincronizarFiltrosConRango({ ...s, seleccionMes })),

  setSeleccionRango: (seleccionRango) =>
    set((s) => sincronizarFiltrosConRango({ ...s, seleccionRango })),

  updateFiltros: (partial) =>
    set((s) => ({ filtros: { ...s.filtros, ...partial } })),

  limpiarFiltros: () => {
    const periodo = getDefaultPeriodo();
    const rango = construirRangoDesdeEstado(
      periodo.modoPeriodo,
      periodo.seleccionMes,
      periodo.seleccionRango
    );
    set({
      ...periodo,
      rango,
      filtros: { ...getDefaultFiltros(), ...rango },
    });
  },

  mostrarFiltros: false,
  setMostrarFiltros: (mostrarFiltros) => set({ mostrarFiltros }),

  reporteActivo: 'gerencial',
  setReporteActivo: (reporteActivo) => set({ reporteActivo }),

  loading: {},
  setLoading: (key, value) =>
    set((s) => ({ loading: { ...s.loading, [key]: value } })),

  setPeriodoPredefinido: (periodo) => {
    const hoy = new Date();
    const desde = new Date();

    switch (periodo) {
      case 'hoy':
        set((s) =>
          sincronizarFiltrosConRango({
            ...s,
            modoPeriodo: 'mes',
            seleccionMes: { anio: hoy.getFullYear(), mes: hoy.getMonth() + 1 },
            filtros: {
              ...s.filtros,
              desde: hoy.toISOString().split('T')[0],
              hasta: hoy.toISOString().split('T')[0],
              periodo: 'diario',
            },
          })
        );
        break;
      case 'mes': {
        const primerDiaDelMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        set((s) =>
          sincronizarFiltrosConRango({
            ...s,
            modoPeriodo: 'mes',
            seleccionMes: { anio: hoy.getFullYear(), mes: hoy.getMonth() + 1 },
            filtros: {
              ...s.filtros,
              desde: primerDiaDelMes.toISOString().split('T')[0],
              hasta: hoy.toISOString().split('T')[0],
              periodo: 'diario',
            },
          })
        );
        break;
      }
      case 'trimestre':
        desde.setMonth(hoy.getMonth() - 3);
        set((s) =>
          sincronizarFiltrosConRango({
            ...s,
            modoPeriodo: 'rango',
            seleccionRango: {
              desdeAnio: desde.getFullYear(),
              desdeMes: desde.getMonth() + 1,
              hastaAnio: hoy.getFullYear(),
              hastaMes: hoy.getMonth() + 1,
            },
            filtros: { ...s.filtros, periodo: 'mensual' },
          })
        );
        break;
      case 'año':
        desde.setMonth(hoy.getMonth() - 6);
        set((s) =>
          sincronizarFiltrosConRango({
            ...s,
            modoPeriodo: 'rango',
            seleccionRango: {
              desdeAnio: desde.getFullYear(),
              desdeMes: desde.getMonth() + 1,
              hastaAnio: hoy.getFullYear(),
              hastaMes: hoy.getMonth() + 1,
            },
            filtros: { ...s.filtros, periodo: 'mensual' },
          })
        );
        break;
      default:
        break;
    }
  },

  buildQueryParams: (filtrosPersonalizados = {}) => {
    const filtrosFinales = { ...get().filtros, ...filtrosPersonalizados };
    const params = new URLSearchParams();
    Object.entries(filtrosFinales).forEach(([key, value]) => {
      if (value && value !== '') params.append(key, value);
    });
    return params.toString();
  },

  validarFiltros: () => {
    const { filtros } = get();
    const { isPeriodoValido, diasEnPeriodo } = getReportesComputed(filtros);
    if (!isPeriodoValido) {
      toast.error('El período seleccionado no es válido');
      return false;
    }
    if (diasEnPeriodo > 365) {
      toast('El período seleccionado es muy amplio, los datos pueden tardar en cargar', {
        duration: 3000,
        icon: '⚠️',
        style: { background: '#f59e0b', color: '#fff' },
      });
    }
    return true;
  },
}));

export default useReportesUIStore;
