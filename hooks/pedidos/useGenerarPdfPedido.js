// hooks/pedidos/useGenerarPdfPedido.js - VERSIÓN CORREGIDA
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { axiosAuth } from '../../utils/apiClient';
import { toastPromise } from '../../utils/toastActions';
import { useGenerarPDFUniversal } from '../shared/useGenerarPDFUniversal';

export function useGenerarPDFPedido() {
  const [generandoPDFMultiple, setGenerandoPDFMultiple] = useState(false);

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

  // ✅ NUEVO Hook para PDFs múltiples con modal - INSTANCIA SEPARADA
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

  // Función para generar PDF individual con modal
  const generarPDFPedidoConModal = async (pedido, productos) => {
    if (!pedido || productos.length === 0) {
      toast.error("Seleccione un pedido con productos");
      return false;
    }

    console.log('🔄 Generando PDF individual para pedido:', pedido.id);

    const apiCall = () => axiosAuth.post(
      `/pedidos/generarpdf-notapedido`,
      { pedido, productos },
      { responseType: "blob" }
    );

    const configuracion = {
      nombreArchivo: `Pedido_${pedido.cliente_nombre}_${pedido.id}.pdf`,
      titulo: 'Nota de Pedido Generada',
      subtitulo: `Pedido #${pedido.id} - ${pedido.cliente_nombre}`,
      mensajeError: 'Error al generar la nota de pedido'
    };

    return await generarPDF(apiCall, configuracion);
  };

  // ✅ FUNCIÓN CORREGIDA: Generar múltiples PDFs CON MODAL
  const generarPDFsPedidosMultiplesConModal = async (pedidosIds) => {
    if (!pedidosIds || pedidosIds.length === 0) {
      toast.error("Seleccione al menos un pedido para imprimir");
      return false;
    }

    console.log('🔄 Generando PDFs múltiples para pedidos:', pedidosIds);

    const apiCall = () => axiosAuth.post(
      `/pedidos/generarpdf-notaspedidos-multiples`,
      { pedidosIds },
      { responseType: "blob" }
    );

    const fechaActual = new Date().toISOString().split('T')[0];
    const configuracion = {
      nombreArchivo: `Notas-Pedidos-Multiples-${fechaActual}.pdf`,
      titulo: 'Notas de Pedido Múltiples',
      subtitulo: `${pedidosIds.length} notas de pedido generadas`,
      mensajeError: 'Error al generar las notas de pedido'
    };

    console.log('🔄 Llamando a generarPDFMultipleInterno con configuración:', configuracion);
    return await generarPDFMultipleInterno(apiCall, configuracion);
  };

  // Función original para descargas directas (MANTENER para compatibilidad)
  const generarPDFPedido = async (pedido, productos) => {
    if (!pedido || productos.length === 0) {
      toast.error("Seleccione un pedido con productos");
      return false;
    }

    try {
      await toastPromise(
        (async () => {
          const response = await axiosAuth.post(
            `/pedidos/generarpdf-notapedido`,
            { pedido, productos },
            { responseType: "blob" }
          );

          const url = window.URL.createObjectURL(new Blob([response.data]));
          const a = document.createElement("a");
          a.href = url;
          a.download = `PEDIDO_${pedido.cliente_nombre}.pdf`;
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
      console.error("Error al generar el PDF:", error);
      return false;
    }
  };

  // Función original para múltiples (MANTENER para compatibilidad)
  const generarPDFsPedidosMultiples = async (pedidosIds) => {
    if (!pedidosIds || pedidosIds.length === 0) {
      toast.error("Seleccione al menos un pedido para imprimir");
      return false;
    }

    setGenerandoPDFMultiple(true);

    try {
      const n = pedidosIds.length;
      await toastPromise(
        (async () => {
          const response = await axiosAuth.post(
            `/pedidos/generarpdf-notaspedidos-multiples`,
            { pedidosIds },
            { responseType: "blob" }
          );

          const url = window.URL.createObjectURL(new Blob([response.data]));
          const a = document.createElement("a");
          a.href = url;
          a.download = `Notas-Pedidos-Multiples-${new Date().toISOString().split('T')[0]}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        })(),
        {
          loading: n === 1 ? 'Generando nota...' : `Generando ${n} notas...`,
          success: n === 1 ? 'Nota lista' : `${n} notas generadas`,
          error: (err) =>
            err.response?.data?.error ||
            err.message ||
            'Error al generar las notas de pedido'
        }
      );
      return true;
    } catch (error) {
      console.error("Error al generar múltiples PDFs de pedidos:", error);
      return false;
    } finally {
      setGenerandoPDFMultiple(false);
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
    
    // ✅ Estados del modal PDF múltiple - CORREGIDO
    generandoPDFMultiple: loadingMultiple, // ⚠️ IMPORTANTE: Usar loadingMultiple, no generandoPDFMultiple
    mostrarModalPDFMultiple,
    pdfURLMultiple,
    nombreArchivoMultiple,
    tituloModalMultiple,
    subtituloModalMultiple,
    
    // Estados originales para compatibilidad
    generandoPDFMultipleOriginal: generandoPDFMultiple,
    
    // Funciones del modal PDF individual
    generarPDFPedidoConModal,
    descargarPDF,
    compartirPDF,
    cerrarModalPDF,
    
    // ✅ Funciones del modal PDF múltiple
    generarPDFsPedidosMultiplesConModal,
    descargarPDFMultiple,
    compartirPDFMultiple,
    cerrarModalPDFMultiple,
    
    // Funciones originales (compatibilidad)
    generarPDFPedido,
    generarPDFsPedidosMultiples
  };
}