// hooks/useReporteGerencial.js
// Carga del reporte gerencial usando el período compartido del store.

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { axiosAuth } from '../utils/apiClient';
import { usePeriodoReportes } from './usePeriodoReportes';

export function useReporteGerencial() {
  const {
    modo,
    setModo,
    seleccionMes,
    setSeleccionMes,
    seleccionRango,
    setSeleccionRango,
    rango,
    meses,
    aniosDisponibles,
    etiquetaPeriodo,
  } = usePeriodoReportes();

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
        params: { desde: r.desde, hasta: r.hasta },
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
      const response = await axiosAuth.get('/finanzas/generar-pdf-gerencial', {
        params: { desde: rango.desde, hasta: rango.hasta },
        responseType: 'arraybuffer',
        headers: {
          'x-no-compression': '1',
          Accept: 'application/pdf',
        },
      });

      const contentType = response.headers?.['content-type'] || '';
      if (contentType.includes('application/json') || contentType.includes('text/')) {
        const texto = new TextDecoder('utf-8').decode(new Uint8Array(response.data));
        let mensaje = 'No se pudo generar el PDF gerencial';
        try {
          const parsed = JSON.parse(texto);
          mensaje = parsed.message || mensaje;
        } catch (_) {
          if (texto) mensaje = texto.slice(0, 200);
        }
        toast.error(mensaje);
        return;
      }

      const bytes = new Uint8Array(response.data);
      if (bytes.byteLength === 0) {
        toast.error('El servidor devolvio un PDF vacio');
        return;
      }

      const firmaOk = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
      if (!firmaOk) {
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
      const mensaje = err?.response?.data?.message || err?.message || 'No se pudo generar el PDF gerencial';
      toast.error(mensaje);
    } finally {
      setGenerandoPDF(false);
    }
  }, [rango]);

  useEffect(() => {
    if (rango.desde && rango.hasta) {
      cargarDatos(rango);
    }
  }, [rango.desde, rango.hasta, cargarDatos]);

  return {
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
    recargar: () => cargarDatos(rango),
    descargarPDF,
    aniosDisponibles,
    meses,
    etiquetaPeriodo,
  };
}

export default useReporteGerencial;
