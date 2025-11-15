import { toast } from 'react-hot-toast';
import { axiosAuth } from '../../utils/apiClient';
import { useGenerarPDFUniversal } from '../shared/useGenerarPDFUniversal';

export function useGenerarPDFControlStock() {
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

  // Generar PDF por filtro (menor/mayor stock)
  const generarPdfPorFiltro = async (tipo, cantidad) => {
    if (!tipo || !cantidad) {
      toast.error('Debe especificar tipo y cantidad de productos.');
      return false;
    }

    // Función que realizará la llamada a la API
    const apiCall = () => axiosAuth({
      url: `/listados/generarpdf-control-stock-filtro`,
      method: 'POST',
      data: { tipo, cantidad },
      responseType: 'blob'
    });

    // Configuración para el modal
    const configuracion = {
      nombreArchivo: `Control_Stock_${tipo === 'menor' ? 'Menor' : 'Mayor'}_${cantidad}_productos.pdf`,
      titulo: 'Control de Stock Generado',
      subtitulo: `${cantidad} productos con ${tipo === 'menor' ? 'menor' : 'mayor'} stock`,
      mensajeExito: 'Control de Stock generado con éxito',
      mensajeError: 'Error al generar el Control de Stock'
    };

    return await generarPDF(apiCall, configuracion);
  };

  // Generar PDF por selección manual de productos
  const generarPdfPorSeleccion = async (productos) => {
    if (!productos || productos.length === 0) {
      toast.error('Debe seleccionar al menos un producto.');
      return false;
    }

    // Preparar datos para enviar al servidor
    const datosControlStock = {
      productos: productos.map(p => ({
        id: p.id,
        nombre: p.nombre,
        unidad_medida: p.unidad_medida || 'Unidad',
        stock_actual: parseFloat(p.stock_actual) || 0,
        categoria_nombre: p.categoria_nombre || 'Sin Categoría'
      }))
    };

    // Función que realizará la llamada a la API
    const apiCall = () => axiosAuth({
      url: `/listados/generarpdf-control-stock-seleccion`,
      method: 'POST',
      data: datosControlStock,
      responseType: 'blob'
    });

    // Configuración para el modal
    const configuracion = {
      nombreArchivo: `Control_Stock_Seleccion_${productos.length}_productos.pdf`,
      titulo: 'Control de Stock Generado',
      subtitulo: `${productos.length} producto(s) seleccionado(s)`,
      mensajeExito: 'Control de Stock generado con éxito',
      mensajeError: 'Error al generar el Control de Stock'
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
    generarPdfPorFiltro,
    generarPdfPorSeleccion,
    descargarPDF,
    compartirPDF,
    cerrarModalPDF
  };
}

