import { useCallback, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { axiosAuth } from '../../utils/apiClient';
import { useGenerarPDFUniversal } from '../shared/useGenerarPDFUniversal';

const TIPOS_DOC_VALIDOS = new Set(['FACTURA', 'NOTA_DEBITO', 'NOTA_CREDITO']);

const getTipoFactor = (tipoDoc) => {
  const tipo = (tipoDoc || '').toString().trim().toUpperCase();
  if (tipo === 'NOTA_CREDITO') return -1;
  if (tipo === 'FACTURA' || tipo === 'NOTA_DEBITO') return 1;
  return 1;
};

export function useResumenCuenta() {
  const [ventas, setVentas] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loadingVentas, setLoadingVentas] = useState(false);
  const [totalDisponibles, setTotalDisponibles] = useState(0);

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
    cerrarModalPDF,
  } = useGenerarPDFUniversal();

  const cargarVentasCliente = useCallback(async (cliente) => {
    if (!cliente?.id && !cliente?.nombre) {
      setVentas([]);
      setSelectedIds([]);
      setTotalDisponibles(0);
      return;
    }

    setLoadingVentas(true);
    setSelectedIds([]);

    try {
      const nombreCliente = cliente.nombre || '';
      const params = new URLSearchParams({
        cliente: nombreCliente,
        porPagina: '200',
        pagina: '1',
      });

      const response = await axiosAuth.get(`/ventas/obtener-ventas?${params.toString()}`);

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Error al cargar ventas del cliente');
      }

      const todasLasVentas = response.data.data || [];
      const total = response.data.total || todasLasVentas.length;

      const ventasFiltradas = todasLasVentas.filter((venta) => {
        const mismoCliente = cliente.id != null
          ? venta.cliente_id === cliente.id
          : true;
        const tipoValido = TIPOS_DOC_VALIDOS.has((venta.tipo_doc || '').toUpperCase());
        const facturada = (venta.estado || '').toLowerCase() === 'facturada';
        return mismoCliente && tipoValido && facturada;
      });

      setVentas(ventasFiltradas);
      setTotalDisponibles(total);

      if (ventasFiltradas.length === 0) {
        toast.info('No se encontraron comprobantes facturados para este cliente');
      } else if (total > 200) {
        toast.info(`Se muestran las últimas 200 facturas. El cliente tiene ${total} en total.`);
      }
    } catch (error) {
      console.error('Error cargando ventas del cliente:', error);
      toast.error(error.response?.data?.message || 'Error al cargar facturas del cliente');
      setVentas([]);
      setTotalDisponibles(0);
    } finally {
      setLoadingVentas(false);
    }
  }, []);

  const limpiarVentas = useCallback(() => {
    setVentas([]);
    setSelectedIds([]);
    setTotalDisponibles(0);
  }, []);

  const toggleVenta = useCallback((id) => {
    setSelectedIds((prev) => (
      prev.includes(id) ? prev.filter((ventaId) => ventaId !== id) : [...prev, id]
    ));
  }, []);

  const toggleTodas = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.length === ventas.length) return [];
      return ventas.map((venta) => venta.id);
    });
  }, [ventas]);

  const totalSeleccionado = useMemo(() => {
    return ventas
      .filter((venta) => selectedIds.includes(venta.id))
      .reduce((acc, venta) => {
        const factor = getTipoFactor(venta.tipo_doc);
        return acc + (Number(venta.total) || 0) * factor;
      }, 0);
  }, [ventas, selectedIds]);

  const todasSeleccionadas = ventas.length > 0 && selectedIds.length === ventas.length;

  const generarResumen = useCallback(async (cliente) => {
    if (!selectedIds.length) {
      toast.error('Seleccione al menos un comprobante');
      return false;
    }

    const apiCall = () => axiosAuth.post(
      '/listados/generarpdf-resumen-cuenta',
      { ventasIds: selectedIds },
      { responseType: 'blob' }
    );

    const clienteSlug = (cliente?.nombre || 'cliente').replace(/[^a-zA-Z0-9]/g, '_');
    const fechaHoy = new Date().toISOString().split('T')[0];

    const configuracion = {
      nombreArchivo: `Resumen_Cuenta_${clienteSlug}_${fechaHoy}.pdf`,
      titulo: 'Resumen de Cuenta Generado',
      subtitulo: `${selectedIds.length} comprobante(s) - ${cliente?.nombre || 'Cliente'}`,
      mensajeError: 'Error al generar el resumen de cuenta',
    };

    return await generarPDF(apiCall, configuracion);
  }, [selectedIds, generarPDF]);

  return {
    ventas,
    selectedIds,
    loadingVentas,
    loadingPDF,
    totalDisponibles,
    totalSeleccionado,
    todasSeleccionadas,
    pdfURL,
    mostrarModalPDF,
    nombreArchivo,
    tituloModal,
    subtituloModal,
    cargarVentasCliente,
    limpiarVentas,
    toggleVenta,
    toggleTodas,
    generarResumen,
    descargarPDF,
    compartirPDF,
    cerrarModalPDF,
  };
}
