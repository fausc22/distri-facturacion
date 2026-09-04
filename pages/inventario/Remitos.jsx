import { useState, useCallback, useEffect, useRef } from 'react';
import Head from 'next/head';
import { toast } from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';

import { useRemitos } from '../../hooks/remitos/useRemitos';
import { useDetalleRemito } from '../../hooks/remitos/useDetalleRemito';
import { useGenerarPDFRemito } from '../../hooks/remitos/useGenerarPDFRemito';

import FiltrosHistorialRemitos from '../../components/remitos/FiltrosHistorialRemitos';
import TablaRemitos from '../../components/remitos/TablaRemitos';
import Pagination from '../../components/common/Pagination';
import { ModalDetalleRemito } from '../../components/remitos/ModalDetalleRemito';
import { BotonAccionesRemitos } from '../../components/remitos/BotonAccionesRemitos';
import { ModalConfirmacionSalida } from '../../components/ventas/ModalesConfirmacion';

export default function HistorialRemitos() {
  const [mostrarConfirmacionSalida, setMostrarConfirmacionSalida] = useState(false);
  const debounceFiltrosRef = useRef(null);

  const { user, loading: authLoading } = useAuth();

  const {
    remitos,
    total,
    selectedRemitos,
    loading,
    paginaActual,
    porPagina,
    filtros,
    setFiltros,
    cargarRemitos,
    handleSelectRemito,
    handleSelectAllRemitos,
    clearSelection,
    getRemitosSeleccionados
  } = useRemitos();

  const {
    selectedRemito,
    productos,
    loading: loadingProductos,
    cargarProductosRemito,
    cerrarDetalle,
    actualizarRemitoLocal
  } = useDetalleRemito();

  const {
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
    imprimiendoMultiple,
    mostrarModalPDFMultiple,
    pdfURLMultiple,
    nombreArchivoMultiple,
    tituloModalMultiple,
    subtituloModalMultiple,
    generarPDFsMultiplesConModal,
    descargarPDFMultiple,
    compartirPDFMultiple,
    cerrarModalPDFMultiple
  } = useGenerarPDFRemito();

  useEffect(() => {
    return () => {
      if (debounceFiltrosRef.current) clearTimeout(debounceFiltrosRef.current);
    };
  }, []);

  const handleRowDoubleClick = async (remito) => {
    try {
      await cargarProductosRemito(remito);
    } catch (error) {
      toast.error('Error al cargar detalles del remito');
    }
  };

  const handleCloseModalDetalle = () => {
    cerrarDetalle();
  };

  const handleGenerarPDF = async () => {
    if (!selectedRemito || productos.length === 0) {
      toast.error('Seleccione un remito con productos');
      return;
    }
    await generarPDFIndividualConModal(selectedRemito, productos);
  };

  const handleImprimirMultiple = async () => {
    const remitosSeleccionados = getRemitosSeleccionados();

    if (remitosSeleccionados.length === 0) {
      toast.error('Seleccione al menos un remito para imprimir');
      return;
    }

    const exito = await generarPDFsMultiplesConModal(remitosSeleccionados);
    if (exito) {
      clearSelection();
    }
  };

  const handleConfirmarSalida = () => {
    setMostrarConfirmacionSalida(true);
  };

  const handleSalir = () => {
    window.location.href = '/';
  };

  const handleFiltrosChangeConLimpieza = useCallback((nuevosFiltros) => {
    setFiltros(nuevosFiltros);
    clearSelection();
    if (debounceFiltrosRef.current) clearTimeout(debounceFiltrosRef.current);
    debounceFiltrosRef.current = setTimeout(() => {
      cargarRemitos({ filtros: nuevosFiltros, pagina: 1 });
    }, 300);
  }, [cargarRemitos, clearSelection, setFiltros]);

  const handleLimpiarFiltrosConSeleccion = useCallback(() => {
    const vacios = {
      cliente: '',
      ciudad: '',
      provincia: '',
      estado: '',
      empleado: '',
      fechaDesde: '',
      fechaHasta: ''
    };
    setFiltros(vacios);
    clearSelection();
    if (debounceFiltrosRef.current) clearTimeout(debounceFiltrosRef.current);
    cargarRemitos({ filtros: vacios, pagina: 1 });
  }, [cargarRemitos, clearSelection, setFiltros]);

  const handlePageChange = useCallback((newPage) => {
    cargarRemitos({ pagina: newPage });
  }, [cargarRemitos]);

  const totalPages = Math.max(1, Math.ceil(total / porPagina));
  const startIndex = (paginaActual - 1) * porPagina;

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <Head>
        <title>VERTIMAR | HISTORIAL DE REMITOS</title>
        <meta name="description" content="Historial de remitos en el sistema VERTIMAR" />
      </Head>

      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-6xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
          HISTORIAL DE REMITOS
        </h1>

        <FiltrosHistorialRemitos
          filtros={filtros}
          onFiltrosChange={handleFiltrosChangeConLimpieza}
          onLimpiarFiltros={handleLimpiarFiltrosConSeleccion}
          user={user}
          totalRemitos={total}
          remitosFiltrados={total}
          remitosOriginales={remitos}
        />

        <TablaRemitos
          remitos={remitos}
          selectedRemitos={selectedRemitos}
          onSelectRemito={handleSelectRemito}
          onSelectAll={() => handleSelectAllRemitos(remitos)}
          onRowDoubleClick={handleRowDoubleClick}
          loading={loading}
          totalRemitos={total}
        />

        <Pagination
          currentPage={paginaActual}
          totalPages={totalPages}
          startIndex={startIndex}
          totalItems={total}
          itemsPerPage={porPagina}
          onPageChange={handlePageChange}
        />

        <BotonAccionesRemitos
          selectedRemitos={selectedRemitos}
          onImprimirMultiple={handleImprimirMultiple}
          imprimiendo={imprimiendoMultiple}
          onVolverMenu={handleConfirmarSalida}
          mostrarModalPDFMultiple={mostrarModalPDFMultiple}
          pdfURLMultiple={pdfURLMultiple}
          nombreArchivoMultiple={nombreArchivoMultiple}
          tituloModalMultiple={tituloModalMultiple}
          subtituloModalMultiple={subtituloModalMultiple}
          onDescargarPDFMultiple={descargarPDFMultiple}
          onCompartirPDFMultiple={compartirPDFMultiple}
          onCerrarModalPDFMultiple={cerrarModalPDFMultiple}
        />
      </div>

      <ModalDetalleRemito
        remito={selectedRemito}
        productos={productos}
        loading={loadingProductos}
        onClose={handleCloseModalDetalle}
        onGenerarPDF={handleGenerarPDF}
        generandoPDF={generandoPDF}
        mostrarModalPDF={mostrarModalPDF}
        pdfURL={pdfURL}
        nombreArchivo={nombreArchivo}
        tituloModal={tituloModal}
        subtituloModal={subtituloModal}
        onDescargarPDF={descargarPDF}
        onCompartirPDF={compartirPDF}
        onCerrarModalPDF={cerrarModalPDF}
        onRemitoActualizado={(cambios) => {
          actualizarRemitoLocal(cambios);
          cargarRemitos({});
        }}
        user={user}
      />

      <ModalConfirmacionSalida
        mostrar={mostrarConfirmacionSalida}
        onConfirmar={handleSalir}
        onCancelar={() => setMostrarConfirmacionSalida(false)}
      />
    </div>
  );
}
