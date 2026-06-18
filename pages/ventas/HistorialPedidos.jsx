import { useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import toast from '@/components/shared/toast';
import useAuth from '../../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/shared/StateViews';
import { usePedidosUIStore } from '@/stores/pedidosUIStore';

import { useHistorialPedidos } from '../../hooks/pedidos/useHistorialPedidos';
import { useEditarPedido } from '../../hooks/pedidos/useEditarPedido';
import { useGenerarPDFPedido } from '../../hooks/pedidos/useGenerarPdfPedido';
import { useAnularPedido } from '../../hooks/pedidos/useAnularPedido';
import { useFacturacion } from '../../hooks/pedidos/useFacturacion';
import { useConnectionContext } from '../../context/ConnectionContext';

import TablaPedidos from '../../components/pedidos/TablaPedidos';
import FiltrosHistorialPedidos from '../../components/pedidos/FiltrosHistorialPedidos';
import { Paginacion } from '../../components/Paginacion';
import { BotonAccionesPedidos } from '../../components/pedidos/BotonAccionesPedidos';
import { BotonFlotanteAcciones } from '../../components/shared/BotonFlotanteAcciones';
import { axiosAuth } from '../../utils/apiClient';

const ModalDetallePedido = dynamic(
  () =>
    import('../../components/pedidos/ModalesHistorialPedidos').then((m) => ({
      default: m.ModalDetallePedido,
    })),
  { ssr: false }
);
const ModalAgregarProductoPedido = dynamic(
  () =>
    import('../../components/pedidos/ModalesHistorialPedidos').then((m) => ({
      default: m.ModalAgregarProductoPedido,
    })),
  { ssr: false }
);
const ModalEditarProductoPedido = dynamic(
  () =>
    import('../../components/pedidos/ModalesHistorialPedidos').then((m) => ({
      default: m.ModalEditarProductoPedido,
    })),
  { ssr: false }
);
const ModalEliminarProductoPedido = dynamic(
  () =>
    import('../../components/pedidos/ModalesHistorialPedidos').then((m) => ({
      default: m.ModalEliminarProductoPedido,
    })),
  { ssr: false }
);
const ModalConfirmacionSalidaPedidos = dynamic(
  () =>
    import('../../components/pedidos/ModalesConfirmacion').then((m) => ({
      default: m.ModalConfirmacionSalidaPedidos,
    })),
  { ssr: false }
);
const ModalConfirmacionAnularPedidoIndividual = dynamic(
  () =>
    import('../../components/pedidos/ModalesConfirmacion').then((m) => ({
      default: m.ModalConfirmacionAnularPedidoIndividual,
    })),
  { ssr: false }
);

function HistorialPedidosContent() {
  const accionesRef = useRef(null);

  const {
    modales,
    openModal,
    closeModal,
    productoEditando,
    setProductoEditando,
    productoEliminando,
    setProductoEliminando,
    pedidoParaAnular,
    setPedidoParaAnular,
  } = usePedidosUIStore();

  const { user, loading: authLoading } = useAuth();
  const { modoOffline, isPWA } = useConnectionContext();
  const bloqueoEdicionOffline = isPWA && modoOffline;

  const { loading: loadingAnular, anularPedido } = useAnularPedido();

  const {
    generandoPDF,
    pdfURL,
    mostrarModalPDF,
    nombreArchivo,
    tituloModal,
    subtituloModal,
    generarPDFPedidoConModal,
    descargarPDF,
    compartirPDF,
    cerrarModalPDF,
    generandoPDFMultiple,
    mostrarModalPDFMultiple,
    pdfURLMultiple,
    nombreArchivoMultiple,
    tituloModalMultiple,
    subtituloModalMultiple,
    generarPDFsPedidosMultiplesConModal,
    descargarPDFMultiple,
    compartirPDFMultiple,
    cerrarModalPDFMultiple,
  } = useGenerarPDFPedido();

  const filtroEmpleado = user && user.rol !== 'GERENTE' ? user.id : null;

  const {
    pedidos,
    pedidosOriginales,
    totalPedidos,
    paginaActual,
    porPagina,
    selectedPedidos,
    loading,
    filtros,
    handleSelectPedido,
    handleSelectAllPedidos,
    clearSelection,
    actualizarPedidoEnLista,
    cargarPedidos,
    cargarPagina,
    actualizarFiltros,
    limpiarFiltros,
    getEstadisticas,
  } = useHistorialPedidos(filtroEmpleado);

  const totalPaginas = Math.max(1, Math.ceil(totalPedidos / porPagina));
  const indexOfPrimero = (paginaActual - 1) * porPagina;
  const indexOfUltimo = Math.min(paginaActual * porPagina, totalPedidos);

  const cambiarPagina = useCallback((numeroPagina) => cargarPagina(numeroPagina), [cargarPagina]);
  const cambiarRegistrosPorPagina = useCallback(
    (cantidad) => cargarPagina(1, cantidad),
    [cargarPagina]
  );

  const {
    selectedPedido,
    productos,
    loading: loadingProductos,
    cargarProductosPedido,
    agregarProducto,
    eliminarProducto,
    actualizarProducto,
    actualizarObservaciones,
    verificarStock,
    cerrarEdicion,
  } = useEditarPedido();

  const { cuentas, loading: cargandoCuentas } = useFacturacion();

  const handleMostrarConfirmacionAnular = (pedido, productosDelPedido) => {
    setPedidoParaAnular({ ...pedido, productos: productosDelPedido || productos });
    openModal('anularPedido');
  };

  const handleAnularPedidoIndividual = async () => {
    if (!pedidoParaAnular) {
      toast.error('No hay pedido para anular');
      return;
    }
    const resultado = await anularPedido(pedidoParaAnular.id);
    if (resultado.success) {
      closeModal('anularPedido');
      closeModal('detalle');
      setPedidoParaAnular(null);
      cerrarEdicion();
      await cargarPedidos();
    }
  };

  const handleCambiarEstadoPedido = async (nuevoEstado) => {
    if (bloqueoEdicionOffline) {
      toast.error('Cambio de estado no disponible sin conexión');
      return;
    }
    if (!selectedPedido) {
      toast.error('No hay pedido seleccionado');
      return;
    }
    if (nuevoEstado === 'Anulado') {
      handleMostrarConfirmacionAnular(selectedPedido, productos);
      return;
    }
    try {
      const response = await axiosAuth.put(`/pedidos/actualizar-estado/${selectedPedido.id}`, {
        estado: nuevoEstado,
      });
      if (response.data.success) {
        toast.success(`Pedido #${selectedPedido.id} marcado como ${nuevoEstado}`);
        closeModal('detalle');
        cerrarEdicion();
        await cargarPedidos();
      } else {
        toast.error(response.data.message || 'Error al cambiar estado del pedido');
      }
    } catch {
      toast.error('Error al cambiar estado del pedido');
    }
  };

  const handleRowDoubleClick = useCallback(
    async (pedido) => {
      try {
        await cargarProductosPedido(pedido);
        openModal('detalle');
      } catch {
        toast.error('Error al cargar detalles del pedido');
      }
    },
    [cargarProductosPedido, openModal]
  );

  const handleCloseModalDetalle = useCallback(() => {
    closeModal('detalle');
    cerrarEdicion();
  }, [cerrarEdicion, closeModal]);

  const handleAgregarProducto = () => {
    if (bloqueoEdicionOffline) {
      toast.error('Para editar pedidos debes reconectar la app');
      return;
    }
    closeModal('detalle');
    setTimeout(() => openModal('agregarProducto'), 300);
  };

  const handleEditarProducto = async (producto) => {
    if (bloqueoEdicionOffline) {
      toast.error('Para editar pedidos debes reconectar la app');
      return;
    }
    try {
      const stockActual = await verificarStock(producto.producto_id);
      const productoConStock = {
        ...producto,
        stock_actual: stockActual,
        precio: Number(producto.precio) || 0,
        cantidad: Number(producto.cantidad) || 1,
        descuento_porcentaje: Number(producto.descuento_porcentaje) || 0,
      };
      closeModal('detalle');
      setProductoEditando(productoConStock);
      setTimeout(() => openModal('editarProducto'), 100);
    } catch {
      toast.error('Error al consultar stock del producto');
    }
  };

  const handleEliminarProducto = (producto) => {
    if (bloqueoEdicionOffline) {
      toast.error('Para editar pedidos debes reconectar la app');
      return;
    }
    setProductoEliminando(producto);
    closeModal('detalle');
    setTimeout(() => openModal('eliminarProducto'), 300);
  };

  const handleCloseModalAgregarProducto = () => {
    closeModal('agregarProducto');
    setTimeout(() => openModal('detalle'), 300);
  };

  const handleCloseModalEditarProducto = () => {
    closeModal('editarProducto');
    setProductoEditando(null);
    setTimeout(() => openModal('detalle'), 100);
  };

  const handleCloseModalEliminarProducto = () => {
    closeModal('eliminarProducto');
    setProductoEliminando(null);
    setTimeout(() => openModal('detalle'), 300);
  };

  const handleProductoChange = (productoModificado) => {
    setProductoEditando((prev) => ({ ...prev, ...productoModificado }));
  };

  const handleConfirmarAgregarProducto = async (producto, cantidad) => {
    try {
      const exito = await agregarProducto(producto, cantidad);
      if (exito) {
        handleCloseModalAgregarProducto();
        await cargarPedidos();
        toast.success('Producto agregado correctamente');
      }
      return exito;
    } catch {
      toast.error('Error al agregar producto');
      return false;
    }
  };

  const handleConfirmarEditarProducto = async (productoEditado) => {
    if (!productoEditado) {
      toast.error('No hay producto para editar');
      return;
    }
    try {
      const exito = await actualizarProducto(productoEditado);
      if (exito) {
        closeModal('editarProducto');
        setProductoEditando(null);
        toast.success('Producto editado correctamente');
        await cargarPedidos();
        setTimeout(() => openModal('detalle'), 200);
      }
    } catch {
      toast.error('Error al editar producto');
      closeModal('editarProducto');
      setProductoEditando(null);
      setTimeout(() => openModal('detalle'), 200);
    }
  };

  const handleConfirmarEliminarProducto = async () => {
    if (!productoEliminando) return;
    try {
      const exito = await eliminarProducto(productoEliminando);
      if (exito) {
        handleCloseModalEliminarProducto();
        await cargarPedidos();
        toast.success('Producto eliminado correctamente');
      }
    } catch {
      toast.error('Error al eliminar producto');
    }
  };

  const handleGenerarPDF = async () => {
    if (!selectedPedido || productos.length === 0) {
      toast.error('Seleccione un pedido con productos');
      return;
    }
    await generarPDFPedidoConModal(selectedPedido, productos);
  };

  const handleActualizarObservaciones = async (nuevasObservaciones) => {
    if (!selectedPedido) {
      toast.error('No hay pedido seleccionado');
      return false;
    }
    const exito = await actualizarObservaciones(nuevasObservaciones);
    if (exito) {
      await cargarPedidos();
      toast.success('Observaciones actualizadas correctamente');
      return true;
    }
    return false;
  };

  const handleActualizarClientePedido = async (nuevoCliente) => {
    if (bloqueoEdicionOffline) {
      toast.error('Cambio de cliente no disponible sin conexión');
      throw new Error('Sin conexión');
    }
    if (!selectedPedido) {
      toast.error('No hay pedido seleccionado');
      throw new Error('No hay pedido seleccionado');
    }
    const response = await axiosAuth.put(`/pedidos/actualizar-cliente/${selectedPedido.id}`, {
      cliente_id: nuevoCliente.id,
    });
    if (response.data.success) {
      toast.success(`Cliente actualizado a: ${nuevoCliente.nombre}`);
      await cargarPedidos();
      const detalleResponse = await axiosAuth.get(`/pedidos/detalle-pedido/${selectedPedido.id}`);
      const pedidoActualizado = detalleResponse?.data?.data?.pedido;
      if (pedidoActualizado) {
        actualizarPedidoEnLista(selectedPedido.id, pedidoActualizado);
        await cargarProductosPedido(pedidoActualizado);
      } else {
        await cargarProductosPedido(selectedPedido);
      }
      return true;
    }
    toast.error(response.data.message || 'Error al actualizar cliente');
    throw new Error(response.data.message);
  };

  const handleImprimirMultiple = useCallback(async () => {
    if (selectedPedidos.length === 0) {
      toast.error('Seleccione al menos un pedido para imprimir');
      return;
    }
    await generarPDFsPedidosMultiplesConModal(selectedPedidos);
  }, [selectedPedidos, generarPDFsPedidosMultiplesConModal]);

  const handleCerrarModalPDFMultiple = useCallback(() => {
    cerrarModalPDFMultiple();
    clearSelection();
  }, [cerrarModalPDFMultiple, clearSelection]);

  const handleSelectAll = useCallback(
    () => handleSelectAllPedidos(pedidos),
    [handleSelectAllPedidos, pedidos]
  );

  const handleFiltrosChange = useCallback(
    (nuevosFiltros) => actualizarFiltros(nuevosFiltros),
    [actualizarFiltros]
  );

  const handleLimpiarFiltros = useCallback(() => limpiarFiltros(), [limpiarFiltros]);

  const scrollToAcciones = useCallback(() => {
    accionesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, []);

  const handlePedidoFacturado = useCallback(
    (pedidoId) => {
      actualizarPedidoEnLista(pedidoId, { estado: 'Facturado' });
      cerrarEdicion();
    },
    [actualizarPedidoEnLista, cerrarEdicion]
  );

  const estadisticas = getEstadisticas();

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <LoadingState message="Verificando autenticación..." />
      </div>
    );
  }

  const getTitulo = () => {
    if (user?.rol === 'GERENTE') return 'HISTORIAL DE PEDIDOS - TODOS LOS PEDIDOS';
    return `HISTORIAL DE PEDIDOS - ${user?.nombre?.toUpperCase() || 'MIS PEDIDOS'}`;
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <Head>
        <title>VERTIMAR | HISTORIAL DE PEDIDOS</title>
        <meta name="description" content="Historial de pedidos en el sistema VERTIMAR" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-8">
        <Card className="mx-auto w-full max-w-6xl shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-xl sm:text-2xl">{getTitulo()}</CardTitle>
          </CardHeader>
          <CardContent>
            <FiltrosHistorialPedidos
              filtros={filtros}
              onFiltrosChange={handleFiltrosChange}
              onLimpiarFiltros={handleLimpiarFiltros}
              user={user}
              totalPedidos={estadisticas.total}
              pedidosFiltrados={estadisticas.filtrado}
            />

            <TablaPedidos
              pedidos={pedidos}
              selectedPedidos={selectedPedidos}
              onSelectPedido={handleSelectPedido}
              onSelectAll={handleSelectAll}
              onRowDoubleClick={handleRowDoubleClick}
              loading={loading}
              mostrarPermisos
              verificarPermisos={() => true}
            />

            <Paginacion
              datosOriginales={pedidos}
              totalRegistros={totalPedidos}
              paginaActual={paginaActual}
              registrosPorPagina={porPagina}
              totalPaginas={totalPaginas}
              indexOfPrimero={indexOfPrimero}
              indexOfUltimo={indexOfUltimo}
              onCambiarPagina={cambiarPagina}
              onCambiarRegistrosPorPagina={cambiarRegistrosPorPagina}
            />

            <BotonAccionesPedidos
              ref={accionesRef}
              contexto="historial"
              selectedPedidos={selectedPedidos}
              onImprimirMultiple={handleImprimirMultiple}
              onVolverMenu={() => openModal('confirmacionSalidaHistorial')}
              loading={generandoPDFMultiple || loading}
              mostrarEstadisticas={false}
              mostrarModalPDFMultiple={mostrarModalPDFMultiple}
              pdfURLMultiple={pdfURLMultiple}
              nombreArchivoMultiple={nombreArchivoMultiple}
              tituloModalMultiple={tituloModalMultiple}
              subtituloModalMultiple={subtituloModalMultiple}
              onDescargarPDFMultiple={descargarPDFMultiple}
              onCompartirPDFMultiple={compartirPDFMultiple}
              onCerrarModalPDFMultiple={handleCerrarModalPDFMultiple}
            />
          </CardContent>
        </Card>
      </main>

      <BotonFlotanteAcciones
        cantidadSeleccionados={selectedPedidos.length}
        onScrollToActions={scrollToAcciones}
        entityLabel="pedidos"
      />

      {modales.detalle && (
        <ModalDetallePedido
          pedido={selectedPedido}
          productos={productos}
          loading={loadingProductos}
          onClose={handleCloseModalDetalle}
          onAgregarProducto={handleAgregarProducto}
          onEditarProducto={handleEditarProducto}
          onEliminarProducto={handleEliminarProducto}
          onCambiarEstado={handleCambiarEstadoPedido}
          onPedidoFacturado={handlePedidoFacturado}
          onGenerarPDF={handleGenerarPDF}
          generandoPDF={generandoPDF}
          mostrarModalFacturacion={modales.facturacion}
          setMostrarModalFacturacion={(v) =>
            v ? openModal('facturacion') : closeModal('facturacion')
          }
          onActualizarObservaciones={handleActualizarObservaciones}
          onActualizarClientePedido={handleActualizarClientePedido}
          isPedidoFacturado={selectedPedido?.estado === 'Facturado'}
          isPedidoAnulado={selectedPedido?.estado === 'Anulado'}
          mostrarModalPDF={mostrarModalPDF}
          pdfURL={pdfURL}
          nombreArchivo={nombreArchivo}
          tituloModal={tituloModal}
          subtituloModal={subtituloModal}
          onDescargarPDF={descargarPDF}
          onCompartirPDF={compartirPDF}
          onCerrarModalPDF={cerrarModalPDF}
          cuentas={cuentas}
          cargandoCuentas={cargandoCuentas}
        />
      )}

      {modales.agregarProducto && (
        <ModalAgregarProductoPedido
          mostrar
          onClose={handleCloseModalAgregarProducto}
          onAgregarProducto={handleConfirmarAgregarProducto}
          productosActuales={productos}
        />
      )}

      {modales.editarProducto && (
        <ModalEditarProductoPedido
          producto={productoEditando}
          onClose={handleCloseModalEditarProducto}
          onGuardar={handleConfirmarEditarProducto}
          onChange={handleProductoChange}
        />
      )}

      {modales.eliminarProducto && (
        <ModalEliminarProductoPedido
          producto={productoEliminando}
          onClose={handleCloseModalEliminarProducto}
          onConfirmar={handleConfirmarEliminarProducto}
        />
      )}

      {modales.confirmacionSalidaHistorial && (
        <ModalConfirmacionSalidaPedidos
          mostrar
          onConfirmar={() => {
            window.location.href = '/';
          }}
          onCancelar={() => closeModal('confirmacionSalidaHistorial')}
        />
      )}

      {modales.anularPedido && (
        <ModalConfirmacionAnularPedidoIndividual
          mostrar
          pedido={pedidoParaAnular}
          productos={productos}
          onConfirmar={handleAnularPedidoIndividual}
          onCancelar={() => {
            closeModal('anularPedido');
            setPedidoParaAnular(null);
          }}
          loading={loadingAnular}
        />
      )}
    </div>
  );
}

export default function HistorialPedidos() {
  return <HistorialPedidosContent />;
}
