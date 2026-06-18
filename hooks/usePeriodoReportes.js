// Período compartido para todas las pestañas de reportes (mes o rango de meses).
import { useMemo } from 'react';
import { useReportesUIStore } from '@/stores/reportesUIStore';

const pad2 = (n) => String(n).padStart(2, '0');

const primerDiaMes = (anio, mes) => `${anio}-${pad2(mes)}-01`;

const ultimoDiaMes = (anio, mes) => {
  const ultimo = new Date(anio, mes, 0);
  return `${ultimo.getFullYear()}-${pad2(ultimo.getMonth() + 1)}-${pad2(ultimo.getDate())}`;
};

export const MESES_REPORTES = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
];

export function usePeriodoReportes() {
  const {
    modoPeriodo,
    setModoPeriodo,
    seleccionMes,
    setSeleccionMes,
    seleccionRango,
    setSeleccionRango,
    rango,
    filtros,
  } = useReportesUIStore();

  const anioActual = useMemo(() => new Date().getFullYear(), []);

  const aniosDisponibles = useMemo(() => {
    const arr = [];
    for (let y = anioActual; y >= anioActual - 5; y--) arr.push(y);
    return arr;
  }, [anioActual]);

  const etiquetaPeriodo = useMemo(() => {
    const labelMes = (m) => MESES_REPORTES.find((x) => x.value === m)?.label || '';
    if (modoPeriodo === 'rango') {
      const ini = `${labelMes(seleccionRango.desdeMes)} ${seleccionRango.desdeAnio}`;
      const fin = `${labelMes(seleccionRango.hastaMes)} ${seleccionRango.hastaAnio}`;
      return ini === fin ? ini : `${ini} - ${fin}`;
    }
    return `${labelMes(seleccionMes.mes)} ${seleccionMes.anio}`;
  }, [modoPeriodo, seleccionMes, seleccionRango]);

  return {
    modo: modoPeriodo,
    setModo: setModoPeriodo,
    seleccionMes,
    setSeleccionMes,
    seleccionRango,
    setSeleccionRango,
    rango,
    filtros,
    meses: MESES_REPORTES,
    aniosDisponibles,
    etiquetaPeriodo,
  };
}
