import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { axiosAuth } from '../../utils/apiClient';
import { useGenerarPDFUniversal } from '../shared/useGenerarPDFUniversal';

export function useGenerarListados() {
  // Hook unificado para PDFs
  const {
    loading: loadingPDF,
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

  // Generar PDF del Libro IVA
  const generarPdfLibroIva = async (mes, anio) => {
    if (!mes || !anio) {
      toast.error('Debe seleccionar mes y año.');
      return false;
    }

    // Función que realizará la llamada a la API
    const apiCall = () => axiosAuth({
      url: `/listados/generarpdf-libro-iva`,
      method: 'POST',
      data: { mes, anio },
      responseType: 'blob'
    });

    // Configuración para el modal
    const mesesNombres = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const mesNombre = mesesNombres[mes - 1];

    const configuracion = {
      nombreArchivo: `Libro_IVA_${mesNombre}_${anio}.pdf`,
      titulo: 'Libro IVA Generado',
      subtitulo: `Libro IVA - ${mesNombre} ${anio}`,
      mensajeExito: 'Libro IVA generado con éxito',
      mensajeError: 'Error al generar el Libro IVA'
    };

    return await generarPDF(apiCall, configuracion);
  };

  // Generar PDF de Lista de Precios (con filtro de categorías)
  const generarPdfListaPrecios = async (categorias = []) => {
    // Función que realizará la llamada a la API
    const apiCall = () => axiosAuth({
      url: `/listados/generarpdf-lista-precios`,
      method: 'POST',
      data: { categorias },
      responseType: 'blob'
    });

    // Configuración para el modal
    const configuracion = {
      nombreArchivo: `Lista_Precios_${new Date().toISOString().split('T')[0]}.pdf`,
      titulo: 'Lista de Precios Generada',
      subtitulo: categorias.length > 0
        ? `Lista de precios - ${categorias.length} categoría(s) seleccionada(s)`
        : 'Lista de precios - Todas las categorías',
      mensajeExito: 'Lista de precios generada con éxito',
      mensajeError: 'Error al generar la lista de precios'
    };

    return await generarPDF(apiCall, configuracion);
  };

  return {
    loading: loadingPDF,
    pdfURL,
    mostrarModalPDF,
    nombreArchivo,
    tituloModal,
    subtituloModal,
    generarPdfLibroIva,
    generarPdfListaPrecios,
    descargarPDF,
    compartirPDF,
    cerrarModalPDF
  };
}
