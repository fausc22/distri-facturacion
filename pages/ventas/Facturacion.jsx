import { useState, useRef, useMemo, useCallback } from 'react';
import Head from 'next/head';
import { toast } from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';

// Hooks personalizados (paginación y filtros en servidor para evitar congelamientos)
import { useHistorialVentas } from '../../hooks/ventas/useHistorialVentas';
import { useFiltrosVentas } from '../../hooks/ventas/useFiltrosVentas';
import { useEditarVenta } from '../../hooks/ventas/useEditarVenta';
import { useComprobantes } from '../../hooks/ventas/useComprobantes';
import { useGenerarPDFsVentas } from '../../hooks/ventas/useGenerarPDFsVentas';
import { useSolicitarCAE } from '../../hooks/ventas/useSolicitarCAE';

// Componentes
import FiltrosHistorialVentas from '../../components/ventas/FiltrosHistorialVentas';
import TablaVentas from '../../components/ventas/TablaVentas';
import { Paginacion } from '../../components/Paginacion';
import { ModalDetalleVenta } from '../../components/ventas/ModalesHistorialVentas';
import { ModalComprobantesVenta } from '../../components/ventas/ModalComprobantesVenta';
import { ModalConfirmacionSalida } from '../../components/ventas/ModalesConfirmacion';
import { BotonAcciones } from '../../components/ventas/BotonAcciones';
import { BotonFlotanteAcciones } from '../../components/ventas/BotonFlotanteAcciones';
import { ModalCrearNota } from '../../components/notas/ModalCrearNota';

// API Client
import { axiosAuth } from '../../utils/apiClient';

function HistorialVentasContent() {
  // Estados para modales
  const [mostrarModalDetalle, setMostrarModalDetalle] = useState(false);
  const [mostrarModalComprobante, setMostrarModalComprobante] = useState(false);
  const [mostrarConfirmacionSalida, setMostrarConfirmacionSalida] = useState(false);
  const [mostrarModalNotaDebito, setMostrarModalNotaDebito] = useState(false);
  const [mostrarModalNotaCredito, setMostrarModalNotaCredito] = useState(false);
  
  // ✅ NUEVO: Estado para ventas desde búsqueda en backend
  const [ventasDesdeBackend, setVentasDesdeBackend] = useState(null);
  const botonesAccionRef = useRef(null);
  const { user, loading: authLoading } = useAuth();

  // Hooks personalizados (paginación en servidor)
  const {
    ventas,
    totalVentas,
    paginaActual,
    porPagina,
    selectedVentas,
    loading,
    usarSoloRecientes,
    diasRecientesDefault,
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

  const cambiarPagina = (numeroPagina) => {
    if (ventasDesdeBackend !== null) return;
    cargarPagina(numeroPagina, filtros, { usarTodoElHistorial: true });
  };

  const cambiarRegistrosPorPagina = (cantidad) => {
    if (ventasDesdeBackend !== null) return;
    cargarVentas({ pagina: 1, porPagina: cantidad, filtros }, { usarTodoElHistorial: true });
  };

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

  const handleBusquedaCliente = (ventasEncontradas) => {
    setVentasDesdeBackend(ventasEncontradas);
    clearSelection();
  };

  // Handlers para eventos de la tabla
  const handleRowDoubleClick = async (venta) => {
    try {
      await cargarProductosVenta(venta);
      await cargarCuenta(venta);
      setMostrarModalDetalle(true);
    } catch (error) {
      toast.error('Error al cargar detalles de la venta');
    }
  };

  const handleCloseModalDetalle = () => {
    setMostrarModalDetalle(false);
    cerrarEdicion();
  };

  // Handlers para comprobantes
  const handleCargarComprobante = async () => {
    if (!selectedVenta) {
      toast.error("Seleccione una venta primero");
      return;
    }
    
    limpiarComprobante();
    await verificarComprobanteExistente(selectedVenta.id);
    setMostrarModalDetalle(false);
    setTimeout(() => setMostrarModalComprobante(true), 300);
  };

  const handleCloseModalComprobante = () => {
    setMostrarModalComprobante(false);
    setTimeout(() => setMostrarModalDetalle(true), 300);
  };

  const handleUploadComprobante = async () => {
    if (!selectedVenta) return;
    
    const exito = await uploadComprobante(selectedVenta.id);
    if (exito) {
      setTimeout(() => {
        setMostrarModalComprobante(false);
        setTimeout(() => setMostrarModalDetalle(true), 300);
      }, 1500);
    }
  };

  const handleViewComprobante = () => {
    if (!selectedVenta) return;
    viewComprobante(selectedVenta.id);
  };

  // Handler para ver comprobante desde el modal de detalle
  const handleVerComprobanteDesdeDetalle = async (ventaId, tipo) => {
    try {
      console.log(`👀 Abriendo comprobante: ${tipo}/${ventaId}`);
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const url = `${apiUrl}/comprobantes/obtener/${tipo}/${ventaId}`;
      
      window.open(url, '_blank', 'noopener,noreferrer');
      toast.success('Comprobante abierto en nueva pestaña');
      
    } catch (error) {
      console.error('❌ Error abriendo comprobante:', error);
      toast.error('Error al abrir el comprobante');
    }
  };

  // Handler para generar PDF individual
  const handleGenerarPDF = async () => {
    if (!selectedVenta || productos.length === 0) {
      toast.error("Seleccione una venta con productos");
      return;
    }

    console.log('🖨️ Generando PDF individual para venta:', selectedVenta.id);
    await generarPDFIndividualConModal(selectedVenta, productos);
  };

  // Función para imprimir múltiples con modal
  const handleImprimirMultiple = async () => {
    // ✅ ACTUALIZADO: Usar ventasAMostrar en lugar de ventasFiltradas
    const ventasSeleccionadas = ventasAMostrar.filter(venta => 
      selectedVentas.includes(venta.id)
    );
    
    if (ventasSeleccionadas.length === 0) {
      toast.error("Seleccione al menos una venta para imprimir");
      return;
    }

    console.log('🖨️ Ventas seleccionadas para imprimir:', 
      ventasSeleccionadas.map(v => ({ id: v.id, cliente: v.cliente_nombre }))
    );
    
    const exito = await generarPDFsMultiplesConModal(ventasSeleccionadas);
    
    if (exito) {
      clearSelection();
    }
  };

  // Handler para generar ranking de ventas
  const handleGenerarRankingVentas = async () => {
    // ✅ ACTUALIZADO: Usar ventasAMostrar
    const ventasSeleccionadas = ventasAMostrar.filter(venta => 
      selectedVentas.includes(venta.id)
    );
    
    if (ventasSeleccionadas.length === 0) {
      toast.error("Seleccione al menos una venta para generar el ranking");
      return;
    }

    console.log('📊 Generando ranking de ventas para:', 
      ventasSeleccionadas.map(v => ({ 
        id: v.id, 
        cliente: v.cliente_nombre,
        total: v.total 
      }))
    );
    
    const exito = await generarRankingVentas(ventasSeleccionadas);
    
    if (exito) {
      console.log('✅ Ranking de ventas generado exitosamente');
    }
  };

  // Handlers para navegación
  const handleConfirmarSalida = () => {
    setMostrarConfirmacionSalida(true);
  };

  const handleSalir = () => {
    window.location.href = '/';
  };

  // Handler para solicitar CAE múltiple (Fase 5: guarda y lista estable)
  const handleSolicitarCAE = async () => {
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
  
  const confirmacion = window.confirm(mensajeConfirmacion);
  
  if (!confirmacion) return;
  
  console.log(`📋 Solicitando CAE para ${ventasSinCAE.length} ventas (${cantidadTipoX} tipo X omitidas)...`);
  
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
        // ✅ MENSAJE MEJORADO con información de tipo X
        let mensajeExito = `✅ Proceso completado:\n${resultado.resumen.exitosos} exitosos\n${resultado.resumen.fallidos} fallidos`;
        
        if (cantidadTipoX > 0) {
          mensajeExito += `\n\n🚫 ${cantidadTipoX} factura${cantidadTipoX > 1 ? 's' : ''} tipo X omitida${cantidadTipoX > 1 ? 's' : ''}`;
        }
        
        toast.success(mensajeExito, { duration: 6000 });
        await cargarVentas({ pagina: paginaActual, porPagina, filtros });
        clearSelection();
      }
    }
  } catch (error) {
    console.error('❌ Error en solicitud de CAE:', error);
    toast.error('Error al procesar solicitudes de CAE');
  }
};

  // Handler para solicitar CAE individual (Fase 5: guarda contra doble envío)
  const handleSolicitarCAEIndividual = async (ventaId) => {
    if (solicitandoCAE) return;

    console.log(`📋 Solicitando CAE para venta individual ${ventaId}...`);

    try {
      const resultado = await solicitarCAE(ventaId);
      
      if (resultado.success) {
        await cargarVentas({ pagina: paginaActual, porPagina, filtros });
        if (selectedVenta && selectedVenta.id === ventaId) {
          await cargarProductosVenta(selectedVenta);
        }
        
        toast.success('CAE obtenido exitosamente');
      }
    } catch (error) {
      console.error('❌ Error solicitando CAE individual:', error);
      toast.error('Error al solicitar CAE');
    }
  };

  // Fase 4: callbacks estables para evitar re-renders innecesarios de FiltrosHistorialVentas
  const handleFiltrosChangeConLimpieza = useCallback(
    (nuevosFiltros) => {
      handleFiltrosChange(nuevosFiltros);
      setVentasDesdeBackend(null);
      clearSelection();
      cargarVentas({ pagina: 1, porPagina, filtros: nuevosFiltros }, { usarTodoElHistorial: true });
    },
    [handleFiltrosChange, clearSelection, cargarVentas, porPagina]
  );

  const handleLimpiarFiltrosConSeleccion = useCallback(() => {
    limpiarFiltros();
    setVentasDesdeBackend(null);
    clearSelection();
    cargarVentas({ pagina: 1, porPagina }, { usarTodoElHistorial: true });
  }, [limpiarFiltros, clearSelection, cargarVentas, porPagina]);

  const scrollToAcciones = () => {
    if (botonesAccionRef.current) {
      botonesAccionRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      // Pequeño feedback visual
      toast.success('👇 Desliza para ver todas las acciones', { duration: 2000 });
    }
  };

  // Mostrar loading mientras se autentica
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <Head>
        <title>VERTIMAR | HISTORIAL DE VENTAS</title>
        <meta name="description" content="Historial de ventas en el sistema VERTIMAR" />
      </Head>
      
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-6xl">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold text-center text-gray-800">
            HISTORIAL DE VENTAS
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setMostrarModalNotaDebito(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              📝 NUEVA NOTA DE DÉBITO
            </button>
            <button
              onClick={() => setMostrarModalNotaCredito(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              📝 NUEVA NOTA DE CRÉDITO
            </button>
          </div>
        </div>
        
        {/* ✅ ACTUALIZADO: Agregar props para búsqueda */}
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

        {/* Fase 3: indicador de vista reciente + opción para ver todo el historial */}
        {ventasDesdeBackend === null && (
          <div className="flex flex-wrap items-center justify-between gap-2 py-2 px-3 bg-gray-50 rounded-lg border border-gray-200 mb-4">
            <span className="text-sm text-gray-600">
              {usarSoloRecientes ? (
                <>Mostrando últimos <strong>{diasRecientesDefault}</strong> días</>
              ) : (
                <>Mostrando <strong>todo el historial</strong></>
              )}
            </span>
            {usarSoloRecientes && (
              <button
                type="button"
                onClick={() => cargarVentas(
                  { pagina: 1, porPagina, filtros: ultimosFiltros },
                  { usarTodoElHistorial: true }
                )}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
              >
                Ver todo el historial
              </button>
            )}
          </div>
        )}
        
        <TablaVentas
          ventas={ventasAMostrar}
          selectedVentas={selectedVentas}
          onSelectVenta={handleSelectVenta}
          onSelectAll={() => handleSelectAllVentas(ventasAMostrar)}
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
          onCancelar={() => setMostrarConfirmacionSalida(false)}
        />
      )}

      {mostrarModalNotaDebito && (
        <ModalCrearNota
          tipoNota="NOTA_DEBITO"
          mostrar
          onClose={() => setMostrarModalNotaDebito(false)}
          onNotaCreada={() => {
            cargarVentas({ pagina: 1, porPagina, filtros });
            toast.success('Nota de Débito creada exitosamente');
          }}
        />
      )}

      {mostrarModalNotaCredito && (
        <ModalCrearNota
          tipoNota="NOTA_CREDITO"
          mostrar
          onClose={() => setMostrarModalNotaCredito(false)}
          onNotaCreada={() => {
            cargarVentas({ pagina: 1, porPagina, filtros });
            toast.success('Nota de Crédito creada exitosamente');
          }}
        />
      )}
    </div>
  );
}

export default function HistorialVentas() {
  return <HistorialVentasContent />;
}