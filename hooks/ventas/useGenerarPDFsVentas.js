import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { axiosAuth } from '../../utils/apiClient';
import { toastPromise } from '../../utils/toastActions';
import { useGenerarPDFUniversal } from '../shared/useGenerarPDFUniversal';
import { useRankingVentas } from './useRankingVentas';

export function useGenerarPDFsVentas() {
  const [imprimiendoMultiple, setImprimiendoMultiple] = useState(false);

  // Hook unificado para PDF individual
  const {
    loading: generandoPDF,
    pdfURL,
    mostrarModalPDF,
    nombreArchivo,
    tituloModal,
    subtituloModal,
    generarPDF,
    descargarPDF,
    compartirPDF,
    cerrarModalPDF
  } = useGenerarPDFUniversal();

  // ✅ Hook para PDFs múltiples con modal
  const {
    loading: loadingMultiple,
    pdfURL: pdfURLMultiple,
    mostrarModalPDF: mostrarModalPDFMultiple,
    nombreArchivo: nombreArchivoMultiple,
    tituloModal: tituloModalMultiple,
    subtituloModal: subtituloModalMultiple,
    generarPDF: generarPDFMultipleInterno,
    descargarPDF: descargarPDFMultiple,
    compartirPDF: compartirPDFMultiple,
    cerrarModalPDF: cerrarModalPDFMultiple
  } = useGenerarPDFUniversal();

  // 🆕 Hook para ranking de ventas
  const {
    generandoRanking,
    pdfURLRanking,
    mostrarModalRanking,
    nombreArchivoRanking,
    tituloModalRanking,
    subtituloModalRanking,
    generarRankingVentas,
    descargarRanking,
    compartirRanking,
    cerrarModalRanking
  } = useRankingVentas();

  // Función para generar PDF individual con modal
  const generarPDFIndividualConModal = async (venta, productos) => {
    if (!venta || productos.length === 0) {
      toast.error("Seleccione una venta con productos");
      return false;
    }

    const apiCall = () => axiosAuth.post(
      `/ventas/generarpdf-factura`,
      { venta, productos },
      { responseType: "blob" }
    );

    const configuracion = {
      nombreArchivo: `Factura_${venta.cliente_nombre}_${venta.id}.pdf`,
      titulo: 'Factura Generada',
      subtitulo: `Factura #${venta.id} - ${venta.cliente_nombre}`,
      mensajeError: 'Error al generar la factura'
    };

    return await generarPDF(apiCall, configuracion);
  };

  // ✅ Generar múltiples PDFs CON MODAL
  const generarPDFsMultiplesConModal = async (ventasSeleccionadas) => {
    if (!ventasSeleccionadas || ventasSeleccionadas.length === 0) {
      toast.error("Seleccione al menos una venta para imprimir");
      return false;
    }

    const ventasIds = ventasSeleccionadas.map(venta => {
      if (typeof venta === 'object' && venta !== null) {
        return venta.id;
      }
      return venta;
    }).filter(id => id && !isNaN(parseInt(id)));

    if (ventasIds.length === 0) {
      toast.error("No se encontraron IDs válidos de ventas");
      return false;
    }

    const apiCall = () => axiosAuth.post(
      `/ventas/generarpdf-facturas-multiples`,
      { ventasIds },
      { responseType: "blob" }
    );

    const configuracion = {
      nombreArchivo: `Facturas-Multiples.pdf`,
      titulo: 'Facturas Múltiples',
      subtitulo: `${ventasIds.length} facturas generadas`,
      mensajeError: 'Error al generar las facturas'
    };

    return await generarPDFMultipleInterno(apiCall, configuracion);
  };

  // Función original para descargas directas (MANTENER para compatibilidad)
  const generarPDFIndividual = async (venta, productos) => {
    if (!venta || productos.length === 0) {
      toast.error("Seleccione una venta con productos");
      return false;
    }

    try {
      await toastPromise(
        (async () => {
          const response = await axiosAuth.post(
            `/ventas/generarpdf-factura`,
            { venta, productos },
            { responseType: "blob" }
          );

          const url = window.URL.createObjectURL(new Blob([response.data]));
          const a = document.createElement("a");
          a.href = url;
          a.download = `FACTURA - ${venta.cliente_nombre}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        })(),
        {
          loading: 'Generando PDF...',
          success: 'PDF generado',
          error: (err) =>
            err.response?.data?.error ||
            err.message ||
            'Error al generar el PDF'
        }
      );
      return true;
    } catch (error) {
      console.error("Error al generar PDF:", error);
      return false;
    }
  };

  // Función original para múltiples (MANTENER para compatibilidad)
  const generarPDFsMultiples = async (ventasSeleccionadas) => {
    if (!ventasSeleccionadas || ventasSeleccionadas.length === 0) {
      toast.error("Seleccione al menos una venta para imprimir");
      return false;
    }

    setImprimiendoMultiple(true);

    try {
      const ventasIds = ventasSeleccionadas.map(venta => {
        if (typeof venta === 'object' && venta !== null) {
          return venta.id;
        }
        return venta;
      }).filter(id => id && !isNaN(parseInt(id)));

      if (ventasIds.length === 0) {
        toast.error("No se encontraron IDs válidos de ventas");
        return false;
      }

      const n = ventasIds.length;
      await toastPromise(
        (async () => {
          const response = await axiosAuth.post(
            `/ventas/generarpdf-facturas-multiples`,
            { ventasIds },
            { responseType: "blob" }
          );

          const url = window.URL.createObjectURL(new Blob([response.data]));
          const a = document.createElement("a");
          a.href = url;
          a.download = `Facturas-Multiples.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        })(),
        {
          loading: n === 1 ? 'Generando factura...' : `Generando ${n} facturas...`,
          success:
            n === 1 ? 'Factura lista' : `${n} facturas generadas`,
          error: (err) =>
            err.response?.data?.error ||
            err.message ||
            'Error al generar las facturas'
        }
      );
      return true;
    } catch (error) {
      console.error("Error al generar múltiples PDFs:", error);
      return false;
    } finally {
      setImprimiendoMultiple(false);
    }
  };

  return {
    // Estados del modal PDF individual
    generandoPDF,
    pdfURL,
    mostrarModalPDF,
    nombreArchivo,
    tituloModal,
    subtituloModal,
    
    // ✅ Estados del modal PDF múltiple
    imprimiendoMultiple: loadingMultiple,
    mostrarModalPDFMultiple,
    pdfURLMultiple,
    nombreArchivoMultiple,
    tituloModalMultiple,
    subtituloModalMultiple,
    
    // 🆕 Estados del ranking de ventas
    generandoRanking,
    mostrarModalRanking,
    pdfURLRanking,
    nombreArchivoRanking,
    tituloModalRanking,
    subtituloModalRanking,
    
    // Estados originales
    imprimiendoMultipleOriginal: imprimiendoMultiple,
    
    // Funciones del modal PDF individual
    generarPDFIndividualConModal,
    descargarPDF,
    compartirPDF,
    cerrarModalPDF,
    
    // ✅ Funciones del modal PDF múltiple
    generarPDFsMultiplesConModal,
    descargarPDFMultiple,
    compartirPDFMultiple,
    cerrarModalPDFMultiple,
    
    // 🆕 Funciones del ranking de ventas
    generarRankingVentas,
    descargarRanking,
    compartirRanking,
    cerrarModalRanking,
    
    // Funciones originales (compatibilidad)
    generarPDFIndividual,
    generarPDFsMultiples
  };
}