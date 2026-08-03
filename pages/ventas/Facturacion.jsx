import { useRef, useMemo, useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import toast from '@/components/shared/toast';
import useAuth from '../../hooks/useAuth';
import { useVentasUIStore } from '@/stores/ventasUIStore';

// Hooks personalizados (paginación y filtros en servidor para evitar congelamientos)
import { useHistorialVentas } from '../../hooks/ventas/useHistorialVentas';
import { useFiltrosVentas } from '../../hooks/ventas/useFiltrosVentas';
import { useEditarVenta } from '../../hooks/ventas/useEditarVenta';
import { useComprobantes } from '../../hooks/ventas/useComprobantes';
import { useGenerarPDFsVentas } from '../../hooks/ventas/useGenerarPDFsVentas';
import { useSolicitarCAE } from '../../hooks/ventas/useSolicitarCAE';

// Componentes — modales pesados con dynamic import (v2 hardening)
const ModalDetalleVenta = dynamic(
  () => import('../../components/ventas/ModalesHistorialVentas').then((m) => ({ default: m.ModalDetalleVenta })),
  { ssr: false }
);
const ModalComprobantesVenta = dynamic(
  () => import('../../components/ventas/ModalComprobantesVenta'),
  { ssr: false }
);
const ModalConfirmacionSalida = dynamic(
  () => import('../../components/ventas/ModalesConfirmacion').then((m) => ({ default: m.ModalConfirmacionSalida })),
  { ssr: false }
);
const ModalCrearNota = dynamic(
  () =>
    import('../../components/notas/ModalCrearNota').then((m) => ({
      default: m.ModalCrearNota,
    })),
  { ssr: false }
);
import FiltrosHistorialVentas from '../../components/ventas/FiltrosHistorialVentas';
import TablaVentas from '../../components/ventas/TablaVentas';
import { Paginacion } from '../../components/Paginacion';
import { BotonAcciones } from '../../components/ventas/BotonAcciones';
import { BotonFlotanteAcciones } from '../../components/ventas/BotonFlotanteAcciones';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { LoadingState } from '@/components/shared/StateViews';
import PageBreadcrumbs from '@/components/shared/PageBreadcrumbs';

// API Client
import { axiosAuth } from '../../utils/apiClient';

function HistorialVentasContent() {
  const { modales, openModal, closeModal, ventasDesdeBackend, setVentasDesdeBackend } =
    useVentasUIStore();

  const mostrarModalDetalle = modales.detalle;
  const mostrarModalComprobante = modales.comprobante;
  const mostrarConfirmacionSalida = modales.confirmacionSalida;
  const mostrarModalNotaDebito = modales.notaDebito;
  const mostrarModalNotaCredito = modales.notaCredito;
  const botonesAccionRef = useRef(null);
  const { user, loading: authLoading } = useAuth();
  const [confirmarCAEOpen, setConfirmarCAEOpen] = useState(false);
  const [confirmarCAEText, setConfirmarCAEText] = useState('');
  const [ventasSinCAEConfirmadas, setVentasSinCAEConfirmadas] = useState([]);

  // Hooks personalizados (paginación en servidor)
  const {
    ventas,
    totalVentas,
    paginaActual,
    porPagina,
    selectedVentas,
    loading,
    ultimosFiltros,
    handleSelectVenta,
    handleSelectAllVentas,
    clearSelection,
    getVentasSeleccionadas,
    cargarVentas,
    cargarPagina
  } = useHistorialVentas();

  // Hook de filtros (solo estado del formulario; el filtrado se hace en el servidor)
  // Fase 4: no calcular ventasFiltradas en cliente (se filtra en servidor)
  const {
    filtros,
    handleFiltrosChange,
    limpiarFiltros
  } = useFiltrosVentas(ventas, { computeVentasFiltradas: false });

  // Lista a mostrar: búsqueda por cliente (una página) o ventas de la página actual
  const ventasAMostrar = ventasDesdeBackend !== null ? ventasDesdeBackend : ventas;
  const totalParaPaginacion = ventasDesdeBackend !== null ? ventasDesdeBackend.length : totalVentas;
  const totalPaginas = ventasDesdeBackend !== null ? 1 : Math.max(1, Math.ceil(totalVentas / porPagina));
  const indexOfPrimero = ventasDesdeBackend !== null ? 0 : (paginaActual - 1) * porPagina;
  const indexOfUltimo = ventasDesdeBackend !== null ? ventasDesdeBackend.length : Math.min(paginaActual * porPagina, totalVentas);

  // Fase 3: memoizar lista de ventas seleccionadas para BotonAcciones (evitar filter en cada render)
  const ventasSeleccionadasCompletas = useMemo(
    () => ventasAMostrar.filter((v) => selectedVentas.includes(v.id)),
    [ventasAMostrar, selectedVentas]
  );

  // Etapa 5: al cambiar de página se limpia la selección para evitar IDs de otra página
  const cambiarPagina = useCallback((numeroPagina) => {
    if (ventasDesdeBackend !== null) return;
    const cambiaPagina = numeroPagina !== paginaActual;
    if (cambiaPagina && selectedVentas.length > 0) {
      clearSelection();
    } else if (cambiaPagina) {
      clearSelection();
    }
    cargarPagina(numeroPagina, filtros);
  }, [ventasDesdeBackend, cargarPagina, filtros, paginaActual, selectedVentas.length, clearSelection]);

  // Etapa 5: al cambiar registros por página se limpia la selección
  const cambiarRegistrosPorPagina = useCallback((cantidad) => {
    if (ventasDesdeBackend !== null) return;
    clearSelection();
    cargarVentas({ pagina: 1, porPagina: cantidad, filtros });
  }, [ventasDesdeBackend, cargarVentas, filtros, selectedVentas.length, clearSelection]);

  const {
    selectedVenta,
    productos,
    cuenta,
    loading: loadingProductos,
    cargarProductosVenta,
    cargarCuenta,
    cerrarEdicion,
    recargarVenta  
  } = useEditarVenta();
  const {
    comprobante,
    comprobantePreview,
    comprobanteExistente,
    uploadingComprobante,
    verificarComprobanteExistente,
    handleFileChange,
    uploadComprobante,
    viewComprobante,
    limpiarComprobante
  } = useComprobantes();

  // Hook para generar PDFs y ranking de ventas
  const {
    // PDF Individual
    generandoPDF,
    pdfURL,
    mostrarModalPDF,
    nombreArchivo,
    tituloModal,
    subtituloModal,
    generarPDFIndividualConModal,
    descargarPDF,
    compartirPDF,
    cerrarModalPDF,
    
    // PDF Múltiple
    imprimiendoMultiple,
    mostrarModalPDFMultiple,
    pdfURLMultiple,
    nombreArchivoMultiple,
    tituloModalMultiple,
    subtituloModalMultiple,
    generarPDFsMultiplesConModal,
    descargarPDFMultiple,
    compartirPDFMultiple,
    cerrarModalPDFMultiple,

    // Ranking de Ventas
    generandoRanking,
    mostrarModalRanking,
    pdfURLRanking,
    nombreArchivoRanking,
    tituloModalRanking,
    subtituloModalRanking,
    generarRankingVentas,
    descargarRanking,
    compartirRanking,
    cerrarModalRanking
  } = useGenerarPDFsVentas();

  const { 
    solicitarCAE, 
    solicitarCAEMultiple, 
    solicitando: solicitandoCAE 
  } = useSolicitarCAE();

  const handleBusquedaCliente = useCallback((ventasEncontradas) => {
    setVentasDesdeBackend(ventasEncontradas);
    clearSelection();
  }, [clearSelection]);

  const handleRowDoubleClick = useCallback(async (venta) => {
    try {
      await Promise.all([cargarProductosVenta(venta), cargarCuenta(venta)]);
      openModal('detalle');
    } catch (error) {
      toast.error('Error al cargar detalles de la venta');
    }
  }, [cargarProductosVenta, cargarCuenta]);

  const handleCloseModalDetalle = useCallback(() => {
    closeModal('detalle');
    cerrarEdicion();
  }, [cerrarEdicion]);

  const handleCargarComprobante = useCallback(async () => {
    if (!selectedVenta) {
      toast.error("Seleccione una venta primero");
      return;
    }
    limpiarComprobante();
    await verificarComprobanteExistente(selectedVenta.id);
    closeModal('detalle');
    setTimeout(() => openModal('comprobante'), 200);
  }, [selectedVenta, limpiarComprobante, verificarComprobanteExistente]);

  const handleCloseModalComprobante = useCallback(() => {
    closeModal('comprobante');
    setTimeout(() => openModal('detalle'), 200);
  }, []);

  const handleUploadComprobante = useCallback(async () => {
    if (!selectedVenta) return;
    const exito = await uploadComprobante(selectedVenta.id);
    if (exito) {
      setTimeout(() => {
        closeModal('comprobante');
        setTimeout(() => openModal('detalle'), 200);
      }, 1500);
    }
  }, [selectedVenta, uploadComprobante]);

  const handleViewComprobante = useCallback(() => {
    if (!selectedVenta) return;
    viewComprobante(selectedVenta.id);
  }, [selectedVenta, viewComprobante]);

  const handleVerComprobanteDesdeDetalle = useCallback(async (ventaId, tipo) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const url = `${apiUrl}/comprobantes/obtener/${tipo}/${ventaId}`;
      
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('❌ Error abriendo comprobante:', error);
      toast.error('Error al abrir el comprobante');
    }
  }, []);

  const handleGenerarPDF = useCallback(async () => {
    if (!selectedVenta || productos.length === 0) {
      toast.error("Seleccione una venta con productos");
      return;
    }

    await generarPDFIndividualConModal(selectedVenta, productos);
  }, [selectedVenta, productos, generarPDFIndividualConModal]);

  const handleImprimirMultiple = useCallback(async () => {
    // ✅ ACTUALIZADO: Usar ventasAMostrar en lugar de ventasFiltradas
    const ventasSeleccionadas = ventasAMostrar.filter(venta => 
      selectedVentas.includes(venta.id)
    );
    
    if (ventasSeleccionadas.length === 0) {
      toast.error("Seleccione al menos una venta para imprimir");
      return;
    }
    
    const exito = await generarPDFsMultiplesConModal(ventasSeleccionadas);
    
    if (exito) {
      clearSelection();
    }
  }, [ventasAMostrar, selectedVentas, generarPDFsMultiplesConModal, clearSelection]);

  const handleGenerarRankingVentas = useCallback(async () => {
    // ✅ ACTUALIZADO: Usar ventasAMostrar
    const ventasSeleccionadas = ventasAMostrar.filter(venta => 
      selectedVentas.includes(venta.id)
    );
    
    if (ventasSeleccionadas.length === 0) {
      toast.error("Seleccione al menos una venta para generar el ranking");
      return;
    }
    
    await generarRankingVentas(ventasSeleccionadas);
  }, [ventasAMostrar, selectedVentas, generarRankingVentas]);

  const handleConfirmarSalida = useCallback(() => {
    openModal('confirmacionSalida');
  }, []);

  const handleSalir = useCallback(() => {
    window.location.href = '/';
  }, []);

  const handleSolicitarCAE = useCallback(async () => {
    if (solicitandoCAE) return;

    const ventasSeleccionadas = ventasSeleccionadasCompletas;

    // ✅ FILTRAR: Excluir facturas tipo X
  const ventasValidasParaCAE = ventasSeleccionadas.filter(venta => {
    const tipoF = (venta.tipo_f || '').toString().trim().toUpperCase();
    return tipoF !== 'X';
  });
  
  // ✅ FILTRAR: Solo las que no tienen CAE
  const ventasSinCAE = ventasValidasParaCAE.filter(venta => !venta.cae_id);
  
  // Validaciones
  if (ventasSeleccionadas.length === 0) {
    toast.error('No hay ventas seleccionadas');
    return;
  }
  
  if (ventasValidasParaCAE.length === 0) {
    toast.error('Las facturas tipo X no requieren CAE de AFIP', {
      duration: 5000,
      icon: '🚫'
    });
    return;
  }
  
  if (ventasSinCAE.length === 0) {
    toast.info('Todas las ventas seleccionadas ya tienen CAE asignado');
    return;
  }
  
  // ✅ MENSAJE DE ADVERTENCIA si hay facturas tipo X
  const cantidadTipoX = ventasSeleccionadas.length - ventasValidasParaCAE.length;
  let mensajeConfirmacion = `¿Solicitar CAE para ${ventasSinCAE.length} venta${ventasSinCAE.length > 1 ? 's' : ''}?\n\n`;
  
  if (cantidadTipoX > 0) {
    mensajeConfirmacion += `⚠️ NOTA: ${cantidadTipoX} factura${cantidadTipoX > 1 ? 's' : ''} tipo X ${cantidadTipoX > 1 ? 'serán omitidas' : 'será omitida'} (no requieren CAE).\n\n`;
  }
  
  mensajeConfirmacion += `Esto enviará las facturas a ARCA/AFIP para obtener autorización electrónica.`;

  setVentasSinCAEConfirmadas(ventasSinCAE);
  setConfirmarCAEText(mensajeConfirmacion);
  setConfirmarCAEOpen(true);
  }, [
    ventasSeleccionadasCompletas,
    solicitarCAE,
    solicitarCAEMultiple,
    cargarVentas,
    paginaActual,
    porPagina,
    filtros,
    clearSelection,
    solicitandoCAE
  ]);

  const ejecutarSolicitudCAE = useCallback(async () => {
  const ventasSinCAE = ventasSinCAEConfirmadas;
  if (ventasSinCAE.length === 0) return;
  setConfirmarCAEOpen(false);
  
  try {
    if (ventasSinCAE.length === 1) {
      const resultado = await solicitarCAE(ventasSinCAE[0].id);
      if (resultado.success) {
        await cargarVentas({ pagina: paginaActual, porPagina, filtros });
        clearSelection();
      }
    } else {
      const ventasIds = ventasSinCAE.map(v => v.id);
      const resultado = await solicitarCAEMultiple(ventasIds);
      
      if (resultado.success) {
        // Resumen: un solo toast lo muestra useSolicitarCAE.solicitarCAEMultiple
        await cargarVentas({ pagina: paginaActual, porPagina, filtros });
        clearSelection();
      }
    }
  } catch (error) {
    console.error('❌ Error en solicitud de CAE:', error);
    toast.error('Error al procesar solicitudes de CAE');
  }
  }, [
    ventasSinCAEConfirmadas,
    solicitarCAE,
    solicitarCAEMultiple,
    cargarVentas,
    paginaActual,
    porPagina,
    filtros,
    clearSelection
  ]);

  const handleSolicitarCAEIndividual = useCallback(async (ventaId) => {
    if (solicitandoCAE) return;

    try {
      const resultado = await solicitarCAE(ventaId);
      
      if (resultado.success) {
        await cargarVentas({ pagina: paginaActual, porPagina, filtros });
        if (selectedVenta && selectedVenta.id === ventaId) {
          await cargarProductosVenta(selectedVenta);
        }
      }
    } catch (error) {
      console.error('❌ Error solicitando CAE individual:', error);
      toast.error('Error al solicitar CAE');
    }
  }, [
    solicitandoCAE,
    solicitarCAE,
    cargarVentas,
    paginaActual,
    porPagina,
    filtros,
    selectedVenta,
    cargarProductosVenta
  ]);

  // Etapa 5: aplicar filtros y avisar si se limpió la selección
  const handleFiltrosChangeConLimpieza = useCallback(
    (nuevosFiltros) => {
      handleFiltrosChange(nuevosFiltros);
      setVentasDesdeBackend(null);
      clearSelection();
      cargarVentas({ pagina: 1, porPagina, filtros: nuevosFiltros });
    },
    [handleFiltrosChange, clearSelection, cargarVentas, porPagina, selectedVentas.length]
  );

  const handleLimpiarFiltrosConSeleccion = useCallback(() => {
    limpiarFiltros();
    setVentasDesdeBackend(null);
    clearSelection();
    cargarVentas({ pagina: 1, porPagina, filtros: {} });
  }, [limpiarFiltros, clearSelection, cargarVentas, porPagina, selectedVentas.length]);

  const scrollToAcciones = useCallback(() => {
    if (botonesAccionRef.current) {
      botonesAccionRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }, []);

  const handleSelectAllTabla = useCallback(() => {
    handleSelectAllVentas(ventasAMostrar);
  }, [handleSelectAllVentas, ventasAMostrar]);

  // Mostrar loading mientras se autentica
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <LoadingState message="Verificando autenticación..." />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <Head>
        <title>VERTIMAR | HISTORIAL DE VENTAS</title>
        <meta name="description" content="Historial de ventas en el sistema VERTIMAR" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-8">
        <div className="mx-auto w-full max-w-6xl rounded-lg border bg-card p-6 shadow-lg">
          <PageBreadcrumbs />
          <div className="mb-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <h1 className="text-center text-3xl font-bold text-foreground">
              HISTORIAL DE VENTAS
            </h1>
            <div className="flex gap-2 flex-wrap justify-center sm:justify-end">
              <button
                type="button"
                onClick={() => openModal('notaDebito')}
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2.5 rounded-lg font-semibold transition-colors flex items-center gap-2 min-h-[44px] min-w-[44px] touch-manipulation"
                aria-label="Nueva Nota de Débito"
              >
                📝 NUEVA NOTA DE DÉBITO
              </button>
              <button
                type="button"
                onClick={() => openModal('notaCredito')}
                className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white px-4 py-2.5 rounded-lg font-semibold transition-colors flex items-center gap-2 min-h-[44px] min-w-[44px] touch-manipulation"
                aria-label="Nueva Nota de Crédito"
              >
                📝 NUEVA NOTA DE CRÉDITO
              </button>
            </div>
          </div>

          <FiltrosHistorialVentas
          filtros={filtros}
          onFiltrosChange={handleFiltrosChangeConLimpieza}
          onLimpiarFiltros={handleLimpiarFiltrosConSeleccion}
          onBusquedaCliente={handleBusquedaCliente}
          user={user}
          totalVentas={totalVentas}
          ventasFiltradas={ventasAMostrar.length}
          ventasOriginales={ventas}
        />

        <TablaVentas
          ventas={ventasAMostrar}
          selectedVentas={selectedVentas}
          onSelectVenta={handleSelectVenta}
          onSelectAll={handleSelectAllTabla}
          onRowDoubleClick={handleRowDoubleClick}
          loading={loading}
        />
        
        <Paginacion
          datosOriginales={ventasAMostrar}
          totalRegistros={totalParaPaginacion}
          paginaActual={paginaActual}
          registrosPorPagina={porPagina}
          totalPaginas={totalPaginas}
          indexOfPrimero={indexOfPrimero}
          indexOfUltimo={indexOfUltimo}
          onCambiarPagina={cambiarPagina}
          onCambiarRegistrosPorPagina={cambiarRegistrosPorPagina}
        />
        
        <div ref={botonesAccionRef}>
          <BotonAcciones
            selectedVentas={selectedVentas}
            ventasSeleccionadasCompletas={ventasSeleccionadasCompletas}
            onImprimirMultiple={handleImprimirMultiple}
            imprimiendo={imprimiendoMultiple}
            onSolicitarCAE={handleSolicitarCAE}
            solicitando={solicitandoCAE}
            onVolverMenu={handleConfirmarSalida}
            // Props para modal PDF múltiple
            mostrarModalPDFMultiple={mostrarModalPDFMultiple}
            pdfURLMultiple={pdfURLMultiple}
            nombreArchivoMultiple={nombreArchivoMultiple}
            tituloModalMultiple={tituloModalMultiple}
            subtituloModalMultiple={subtituloModalMultiple}
            onDescargarPDFMultiple={descargarPDFMultiple}
            onCompartirPDFMultiple={compartirPDFMultiple}
            onCerrarModalPDFMultiple={cerrarModalPDFMultiple}
            // Props para ranking de ventas
            onGenerarRankingVentas={handleGenerarRankingVentas}
            generandoRanking={generandoRanking}
            mostrarModalRanking={mostrarModalRanking}
            pdfURLRanking={pdfURLRanking}
            nombreArchivoRanking={nombreArchivoRanking}
            tituloModalRanking={tituloModalRanking}
            subtituloModalRanking={subtituloModalRanking}
            onDescargarRanking={descargarRanking}
            onCompartirRanking={compartirRanking}
            onCerrarModalRanking={cerrarModalRanking}
          />
        </div>
        </div>
      </main>

      <BotonFlotanteAcciones
          cantidadSeleccionados={selectedVentas.length}
          onScrollToActions={scrollToAcciones}
        />
      
      {/* Fase 6: montar modales solo cuando estén abiertos (menos DOM y efectos) */}
      {mostrarModalDetalle && (
        <ModalDetalleVenta
          venta={selectedVenta}
          productos={productos}
          loading={loadingProductos}
          onClose={handleCloseModalDetalle}
          onImprimirFacturaIndividual={handleGenerarPDF}
          generandoPDF={generandoPDF}
          cuenta={cuenta}
          mostrarModalPDF={mostrarModalPDF}
          pdfURL={pdfURL}
          nombreArchivo={nombreArchivo}
          tituloModal={tituloModal}
          subtituloModal={subtituloModal}
          onDescargarPDF={descargarPDF}
          onCompartirPDF={compartirPDF}
          onCerrarModalPDF={cerrarModalPDF}
          onVerComprobante={handleVerComprobanteDesdeDetalle}
          onSolicitarCAE={handleSolicitarCAEIndividual}
          solicitandoCAE={solicitandoCAE}
          onRecargarVenta={recargarVenta}
        />
      )}

      {mostrarModalComprobante && (
        <ModalComprobantesVenta
          mostrar
          venta={selectedVenta}
          comprobante={comprobante}
          comprobantePreview={comprobantePreview}
          comprobanteExistente={comprobanteExistente}
          uploadingComprobante={uploadingComprobante}
          onClose={handleCloseModalComprobante}
          onFileChange={handleFileChange}
          onUpload={handleUploadComprobante}
          onView={handleViewComprobante}
        />
      )}

      {mostrarConfirmacionSalida && (
        <ModalConfirmacionSalida
          mostrar
          onConfirmar={handleSalir}
          onCancelar={() => closeModal('confirmacionSalida')}
        />
      )}

      {mostrarModalNotaDebito && (
        <ModalCrearNota
          tipoNota="NOTA_DEBITO"
          mostrar
          onClose={() => closeModal('notaDebito')}
          onNotaCreada={() => {
            cargarVentas({ pagina: 1, porPagina, filtros });
          }}
        />
      )}

      {mostrarModalNotaCredito && (
        <ModalCrearNota
          tipoNota="NOTA_CREDITO"
          mostrar
          onClose={() => closeModal('notaCredito')}
          onNotaCreada={() => {
            cargarVentas({ pagina: 1, porPagina, filtros });
          }}
        />
      )}

      <ConfirmModal
        open={confirmarCAEOpen}
        onOpenChange={setConfirmarCAEOpen}
        title="Confirmar solicitud de CAE"
        description={confirmarCAEText}
        confirmLabel="Solicitar CAE"
        cancelLabel="Cancelar"
        onConfirm={ejecutarSolicitudCAE}
      />
    </div>
  );
}

export default function HistorialVentas() {
  return <HistorialVentasContent />;
}