// hooks/useReporteGerencial.js
// Estado y carga de datos del Reporte Gerencial.
// El filtro principal trabaja por MES (mes + año). Un modo "rango" opcional
// permite seleccionar varios meses (desde mes/año hasta mes/año).
// El hook expone { desde, hasta } siempre normalizados a primer/último día del mes.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { axiosAuth } from '../utils/apiClient';

const pad2 = (n) => String(n).padStart(2, '0');

// Devuelve YYYY-MM-DD del primer día del mes
const primerDiaMes = (anio, mes /* 1-12 */) =>
  `${anio}-${pad2(mes)}-01`;

// Devuelve YYYY-MM-DD del último día del mes (calculado en JS, no MySQL)
const ultimoDiaMes = (anio, mes /* 1-12 */) => {
  // El "día 0" del mes siguiente equivale al último día del mes actual
  const ultimo = new Date(anio, mes, 0);
  return `${ultimo.getFullYear()}-${pad2(ultimo.getMonth() + 1)}-${pad2(ultimo.getDate())}`;
};

const construirRango = (modo, ref) => {
  if (modo === 'rango') {
    return {
      desde: primerDiaMes(ref.desdeAnio, ref.desdeMes),
      hasta: ultimoDiaMes(ref.hastaAnio, ref.hastaMes)
    };
  }
  return {
    desde: primerDiaMes(ref.anio, ref.mes),
    hasta: ultimoDiaMes(ref.anio, ref.mes)
  };
};

const compararRangos = (rangoA, rangoB) =>
  rangoA.desde === rangoB.desde && rangoA.hasta === rangoB.hasta;

export function useReporteGerencial() {
  const ahora = useMemo(() => new Date(), []);
  const anioActual = ahora.getFullYear();
  const mesActual = ahora.getMonth() + 1; // 1-12

  // 'mes' = un solo mes, 'rango' = entre dos meses (filtro especial)
  const [modo, setModo] = useState('mes');

  // Estado del modo "mes"
  const [seleccionMes, setSeleccionMes] = useState({
    anio: anioActual,
    mes: mesActual
  });

  // Estado del modo "rango"
  const [seleccionRango, setSeleccionRango] = useState({
    desdeAnio: anioActual,
    desdeMes: 1,
    hastaAnio: anioActual,
    hastaMes: mesActual
  });

  const rango = useMemo(() => {
    if (modo === 'rango') {
      // Validación de orden cronológico: si está al revés, lo corregimos al vuelo
      const ini = new Date(seleccionRango.desdeAnio, seleccionRango.desdeMes - 1, 1);
      const fin = new Date(seleccionRango.hastaAnio, seleccionRango.hastaMes - 1, 1);
      if (ini > fin) {
        return construirRango('rango', {
          desdeAnio: seleccionRango.hastaAnio,
          desdeMes: seleccionRango.hastaMes,
          hastaAnio: seleccionRango.desdeAnio,
          hastaMes: seleccionRango.desdeMes
        });
      }
      return construirRango('rango', seleccionRango);
    }
    return construirRango('mes', seleccionMes);
  }, [modo, seleccionMes, seleccionRango]);

  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generandoPDF, setGenerandoPDF] = useState(false);

  const cargarDatos = useCallback(async (rangoOverride) => {
    const r = rangoOverride || rango;
    setLoading(true);
    setError(null);
    try {
      const response = await axiosAuth.get('/finanzas/reporte-gerencial', {
        params: { desde: r.desde, hasta: r.hasta }
      });
      if (response.data?.success) {
        setDatos(response.data.data);
        return response.data.data;
      }
      const msg = response.data?.message || 'No se pudo cargar el reporte gerencial';
      setError(msg);
      toast.error(msg);
      return null;
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Error al cargar el reporte gerencial';
      setError(msg);
      toast.error(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [rango]);

  const descargarPDF = useCallback(async () => {
    if (!rango.desde || !rango.hasta) {
      toast.error('Selecciona un mes valido');
      return;
    }
    setGenerandoPDF(true);
    try {
      // Pedimos arraybuffer en vez de blob: tenemos control directo sobre los bytes
      // y podemos verificar la firma %PDF antes de armar el Blob, evitando descargar PDFs corruptos.
      const response = await axiosAuth.get('/finanzas/generar-pdf-gerencial', {
        params: { desde: rango.desde, hasta: rango.hasta },
        responseType: 'arraybuffer',
        headers: {
          // server.js respeta este header en el middleware de compression para no comprimir el binario
          'x-no-compression': '1',
          Accept: 'application/pdf'
        }
      });

      const contentType = response.headers?.['content-type'] || '';

      // Si el backend devolvio un error JSON pese al responseType=arraybuffer
      if (contentType.includes('application/json') || contentType.includes('text/')) {
        const texto = new TextDecoder('utf-8').decode(new Uint8Array(response.data));
        let mensaje = 'No se pudo generar el PDF gerencial';
        try {
          const parsed = JSON.parse(texto);
          mensaje = parsed.message || mensaje;
        } catch (_) {
          if (texto) mensaje = texto.slice(0, 200);
        }
        console.error('Error backend generando PDF gerencial:', mensaje);
        toast.error(mensaje);
        return;
      }

      const bytes = new Uint8Array(response.data);
      if (bytes.byteLength === 0) {
        toast.error('El servidor devolvio un PDF vacio');
        return;
      }

      // Validar firma "%PDF" en los primeros 4 bytes
      const firmaOk = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
      if (!firmaOk) {
        const muestra = new TextDecoder('utf-8').decode(bytes.slice(0, 200));
        console.error('Respuesta no es un PDF valido. Muestra inicial:', muestra);
        toast.error('La respuesta del servidor no es un PDF valido');
        return;
      }

      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte_gerencial_${rango.desde}_a_${rango.hasta}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('PDF generado correctamente');
    } catch (err) {
      let mensaje = err?.response?.data?.message || err?.message || 'No se pudo generar el PDF gerencial';
      try {
        if (err?.response?.data instanceof ArrayBuffer) {
          const texto = new TextDecoder('utf-8').decode(new Uint8Array(err.response.data));
          const parsed = JSON.parse(texto);
          mensaje = parsed.message || mensaje;
        }
      } catch (_) { /* noop */ }
      console.error('Error generando PDF gerencial:', err, mensaje);
      toast.error(mensaje);
    } finally {
      setGenerandoPDF(false);
    }
  }, [rango]);

  // Auto-carga cuando cambia el rango efectivo
  const [ultimoRangoCargado, setUltimoRangoCargado] = useState(null);
  useEffect(() => {
    if (!ultimoRangoCargado || !compararRangos(ultimoRangoCargado, rango)) {
      setUltimoRangoCargado(rango);
      cargarDatos(rango);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rango.desde, rango.hasta]);

  // Helpers para la UI
  const aniosDisponibles = useMemo(() => {
    const arr = [];
    for (let y = anioActual; y >= anioActual - 5; y--) arr.push(y);
    return arr;
  }, [anioActual]);

  const meses = useMemo(() => ([
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
    { value: 12, label: 'Diciembre' }
  ]), []);

  const etiquetaPeriodo = useMemo(() => {
    const labelMes = (m) => meses.find(x => x.value === m)?.label || '';
    if (modo === 'rango') {
      const ini = `${labelMes(seleccionRango.desdeMes)} ${seleccionRango.desdeAnio}`;
      const fin = `${labelMes(seleccionRango.hastaMes)} ${seleccionRango.hastaAnio}`;
      return ini === fin ? ini : `${ini} - ${fin}`;
    }
    return `${labelMes(seleccionMes.mes)} ${seleccionMes.anio}`;
  }, [modo, seleccionMes, seleccionRango, meses]);

  return {
    // estado
    modo,
    setModo,
    seleccionMes,
    setSeleccionMes,
    seleccionRango,
    setSeleccionRango,
    rango,
    datos,
    loading,
    error,
    generandoPDF,

    // acciones
    recargar: () => cargarDatos(rango),
    descargarPDF,

    // helpers
    aniosDisponibles,
    meses,
    etiquetaPeriodo
  };
}

export default useReporteGerencial;
