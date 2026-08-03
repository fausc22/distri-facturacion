import {
  useReportesUIStore,
  getReportesComputed,
} from '@/stores/reportesUIStore';

export function useReportes() {
  const store = useReportesUIStore();
  const computed = getReportesComputed(store.filtros);

  return {
    filtros: store.filtros,
    reporteActivo: store.reporteActivo,
    mostrarFiltros: store.mostrarFiltros,
    updateFiltros: store.updateFiltros,
    limpiarFiltros: store.limpiarFiltros,
    setPeriodoPredefinido: store.setPeriodoPredefinido,
    validarFiltros: store.validarFiltros,
    setReporteActivo: store.setReporteActivo,
    setMostrarFiltros: store.setMostrarFiltros,
    buildQueryParams: store.buildQueryParams,
    ...computed,
  };
}
