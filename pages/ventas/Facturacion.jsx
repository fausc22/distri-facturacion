import { useState, useRef } from 'react';
import Head from 'next/head';
import { toast } from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';

// Hooks personalizados
import { useHistorialVentas } from '../../hooks/ventas/useHistorialVentas';
import { useFiltrosVentas } from '../../hooks/ventas/useFiltrosVentas';
import { usePaginacion } from '../../hooks/usePaginacion';
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

// API Client
import { axiosAuth } from '../../utils/apiClient';

function HistorialVentasContent() {
  // Estados para modales
  const [mostrarModalDetalle, setMostrarModalDetalle] = useState(false);
  const [mostrarModalComprobante, setMostrarModalComprobante] = useState(false);
  const [mostrarConfirmacionSalida, setMostrarConfirmacionSalida] = useState(false);
  
  // ✅ NUEVO: Estado para ventas desde búsqueda en backend
  const [ventasDesdeBackend, setVentasDesdeBackend] = useState(null);
  const botonesAccionRef = useRef(null);
  const { user, loading: authLoading } = useAuth();

  // Hooks personalizados
  const { 
    ventas, 
    selectedVentas, 
    loading, 
    handleSelectVenta, 
    handleSelectAllVentas, 
    clearSelection, 
    getVentasSeleccionadas, 
    cargarVentas 
  } = useHistorialVentas();
  
  // Hook de filtros para ventas
  const { 
    filtros, 
    ventasFiltradas, 
    handleFiltrosChange, 
    limpiarFiltros 
  } = useFiltrosVentas(ventas);

  // ✅ ACTUALIZADO: Usar ventasAMostrar en lugar de ventasFiltradas directamente
  const ventasAMostrar = ventasDesdeBackend || ventasFiltradas;
  
  const {
    datosActuales: ventasActuales,
    paginaActual,
    registrosPorPagina,
    totalPaginas,
    indexOfPrimero,
    indexOfUltimo,
    cambiarPagina,
    cambiarRegistrosPorPagina
  } = usePaginacion(ventasAMostrar, 10); // ✅ ACTUALIZADO

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

  // ✅ NUEVA FUNCIÓN: Handler para búsqueda de cliente desde backend
  const handleBusquedaCliente = (ventasEncontradas) => {
    console.log('📥 Resultados de búsqueda recibidos:', ventasEncontradas.length);
    setVentasDesdeBackend(ventasEncontradas);
    clearSelection(); // Limpiar selección al hacer nueva búsqueda
    cambiarPagina(1); // Resetear a primera página
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

  // Handler para solicitar CAE múltiple
const handleSolicitarCAE = async () => {
  // Obtener ventas seleccionadas completas
  const ventasSeleccionadas = ventasAMostrar.filter(venta => 
    selectedVentas.includes(venta.id)
  );
  
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
        await cargarVentas();
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
        
        await cargarVentas();
        clearSelection();
      }
    }
  } catch (error) {
    console.error('❌ Error en solicitud de CAE:', error);
    toast.error('Error al procesar solicitudes de CAE');
  }
};

  // Handler para solicitar CAE individual
  const handleSolicitarCAEIndividual = async (ventaId) => {
    console.log(`📋 Solicitando CAE para venta individual ${ventaId}...`);
    
    try {
      const resultado = await solicitarCAE(ventaId);
      
      if (resultado.success) {
        await cargarVentas();
        
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

  // Limpiar selección cuando cambian los filtros
  const handleFiltrosChangeConLimpieza = (nuevosFiltros) => {
    handleFiltrosChange(nuevosFiltros);
    setVentasDesdeBackend(null); // ✅ NUEVO: Limpiar búsqueda al cambiar filtros
    clearSelection();
    cambiarPagina(1);
  };

  // ✅ ACTUALIZADO: Limpiar búsqueda al limpiar filtros
  const handleLimpiarFiltrosConSeleccion = () => {
    limpiarFiltros();
    setVentasDesdeBackend(null); // ✅ NUEVO: Limpiar búsqueda
    clearSelection();
    cambiarPagina(1);
  };

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
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
          HISTORIAL DE VENTAS
        </h1>
        
        {/* ✅ ACTUALIZADO: Agregar props para búsqueda */}
        <FiltrosHistorialVentas
          filtros={filtros}
          onFiltrosChange={handleFiltrosChangeConLimpieza}
          onLimpiarFiltros={handleLimpiarFiltrosConSeleccion}
          onBusquedaCliente={handleBusquedaCliente} // ✅ NUEVA PROP
          user={user}
          totalVentas={ventas.length}
          ventasFiltradas={ventasAMostrar.length} // ✅ ACTUALIZADO
          ventasOriginales={ventas}
        />
        
        <TablaVentas
          ventas={ventasActuales}
          selectedVentas={selectedVentas}
          onSelectVenta={handleSelectVenta}
          onSelectAll={() => handleSelectAllVentas(ventasActuales)}
          onRowDoubleClick={handleRowDoubleClick}
          loading={loading}
        />
        
        {/* ✅ ACTUALIZADO: Usar ventasAMostrar */}
        <Paginacion
          datosOriginales={ventasAMostrar}
          paginaActual={paginaActual}
          registrosPorPagina={registrosPorPagina}
          totalPaginas={totalPaginas}
          indexOfPrimero={indexOfPrimero}
          indexOfUltimo={indexOfUltimo}
          onCambiarPagina={cambiarPagina}
          onCambiarRegistrosPorPagina={cambiarRegistrosPorPagina}
        />
        
        <div ref={botonesAccionRef}>
          <BotonAcciones
            selectedVentas={selectedVentas}
            ventasSeleccionadasCompletas={ventasAMostrar.filter(v => selectedVentas.includes(v.id))} // ✅ NUEVA PROP
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
      
      <ModalDetalleVenta
        venta={selectedVenta}
        productos={productos}
        loading={loadingProductos}
        onClose={handleCloseModalDetalle}
        onImprimirFacturaIndividual={handleGenerarPDF}
        generandoPDF={generandoPDF}
        cuenta={cuenta}
        // Props para modal PDF individual
        mostrarModalPDF={mostrarModalPDF}
        pdfURL={pdfURL}
        nombreArchivo={nombreArchivo}
        tituloModal={tituloModal}
        subtituloModal={subtituloModal}
        onDescargarPDF={descargarPDF}
        onCompartirPDF={compartirPDF}
        onCerrarModalPDF={cerrarModalPDF}
        // Props para ver comprobante
        onVerComprobante={handleVerComprobanteDesdeDetalle}
        // Props para solicitar CAE
        onSolicitarCAE={handleSolicitarCAEIndividual}  
        solicitandoCAE={solicitandoCAE}
        // ✅ NUEVA PROP: Función para recargar venta
        onRecargarVenta={recargarVenta}
      />

      <ModalComprobantesVenta
        mostrar={mostrarModalComprobante}
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

      <ModalConfirmacionSalida
        mostrar={mostrarConfirmacionSalida}
        onConfirmar={handleSalir}
        onCancelar={() => setMostrarConfirmacionSalida(false)}
      />
    </div>
  );
}

export default function HistorialVentas() {
  return <HistorialVentasContent />;
}