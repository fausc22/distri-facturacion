import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { toast } from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';

// Hooks personalizados
import { useHistorialPedidos } from '../../hooks/pedidos/useHistorialPedidos';
import { useEditarPedido } from '../../hooks/pedidos/useEditarPedido';
import { useGenerarPDFPedido } from '../../hooks/pedidos/useGenerarPdfPedido';
import { useAnularPedido } from '../../hooks/pedidos/useAnularPedido';
import { useFacturacion } from '../../hooks/pedidos/useFacturacion';
import { useConnectionContext } from '../../context/ConnectionContext';
// Componentes
import TablaPedidos from '../../components/pedidos/TablaPedidos';
import FiltrosHistorialPedidos from '../../components/pedidos/FiltrosHistorialPedidos';
import { Paginacion } from '../../components/Paginacion';
import { 
  ModalDetallePedido, 
  ModalEditarProductoPedido, 
  ModalEliminarProductoPedido, 
  ModalAgregarProductoPedido 
} from '../../components/pedidos/ModalesHistorialPedidos';
import { 
  ModalConfirmacionSalidaPedidos,
  ModalConfirmacionAnularPedidoIndividual
} from '../../components/pedidos/ModalesConfirmacion';
import { BotonAccionesPedidos } from '../../components/pedidos/BotonAccionesPedidos';
import { axiosAuth } from '../../utils/apiClient';

function HistorialPedidosContent() {
  // Estados para modales existentes
  const [mostrarModalDetalle, setMostrarModalDetalle] = useState(false);
  const [mostrarModalAgregarProducto, setMostrarModalAgregarProducto] = useState(false);
  const [mostrarModalEditarProducto, setMostrarModalEditarProducto] = useState(false);
  const [mostrarModalEliminarProducto, setMostrarModalEliminarProducto] = useState(false);
  const [mostrarConfirmacionSalida, setMostrarConfirmacionSalida] = useState(false);
  const [mostrarModalFacturacion, setMostrarModalFacturacion] = useState(false);

  // Estados para anulación individual
  const [mostrarModalAnularPedido, setMostrarModalAnularPedido] = useState(false);
  const [pedidoParaAnular, setPedidoParaAnular] = useState(null);

  // Estados para productos en edición
  const [productoEditando, setProductoEditando] = useState(null);
  const [productoEliminando, setProductoEliminando] = useState(null);

  // Hook de autenticación
  const { user, loading: authLoading } = useAuth();
  const { modoOffline, isPWA } = useConnectionContext();
  // Solo bloquear edición en PWA cuando está en modo offline (en desktop no mostramos "Reconectar" y modoOffline puede quedar true por un fallo previo)
  const bloqueoEdicionOffline = isPWA && modoOffline;

  // Hook para anular pedidos
  const { loading: loadingAnular, anularPedido } = useAnularPedido();

  // ✅ Hook para generar PDFs
  const {
    // PDF Individual
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
    
    // PDF Múltiple
    generandoPDFMultiple,
    mostrarModalPDFMultiple,
    pdfURLMultiple,
    nombreArchivoMultiple,
    tituloModalMultiple,
    subtituloModalMultiple,
    generarPDFsPedidosMultiplesConModal,
    descargarPDFMultiple,
    compartirPDFMultiple,
    cerrarModalPDFMultiple
  } = useGenerarPDFPedido();

  // Determinar si debe filtrar por empleado
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
    cambiarEstadoMultiple,
    eliminarMultiple,
    cargarPedidos,
    cargarPagina,
    actualizarFiltros,
    limpiarFiltros,
    getEstadisticas
  } = useHistorialPedidos(filtroEmpleado);

  const totalPaginas = Math.max(1, Math.ceil(totalPedidos / porPagina));
  const indexOfPrimero = (paginaActual - 1) * porPagina;
  const indexOfUltimo = Math.min(paginaActual * porPagina, totalPedidos);

  const cambiarPagina = useCallback((numeroPagina) => {
    cargarPagina(numeroPagina);
  }, [cargarPagina]);

  const cambiarRegistrosPorPagina = useCallback((cantidad) => {
    cargarPagina(1, cantidad);
  }, [cargarPagina]);

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
    puedeEditarProductos
  } = useEditarPedido();

  const { cuentas, loading: cargandoCuentas } = useFacturacion();

  // Verificar permisos de edición
  const esGerente = user?.rol === 'GERENTE';
  const puedeEditarProductosPedido = true;

  // FUNCIONES para anular pedidos
  const handleMostrarConfirmacionAnular = (pedido, productosDelPedido) => {
    setPedidoParaAnular({
      ...pedido,
      productos: productosDelPedido || productos
    });
    setMostrarModalAnularPedido(true);
  };

  const handleAnularPedidoIndividual = async () => {
    if (!pedidoParaAnular) {
      toast.error('No hay pedido para anular');
      return;
    }

    const resultado = await anularPedido(pedidoParaAnular.id);
    
    if (resultado.success) {
      setMostrarModalAnularPedido(false);
      setMostrarModalDetalle(false);
      setPedidoParaAnular(null);
      cerrarEdicion();
      await cargarPedidos();
    }
  };

  // FUNCIÓN para cambiar estado de pedido
  const handleCambiarEstadoPedido = async (nuevoEstado) => {
    if (bloqueoEdicionOffline) {
      toast.error('Cambio de estado no disponible sin conexión');
      return;
    }

    if (!selectedPedido) {
      toast.error("No hay pedido seleccionado");
      return;
    }

    if (nuevoEstado === 'Anulado') {
      handleMostrarConfirmacionAnular(selectedPedido, productos);
      return;
    }

    try {
      const response = await axiosAuth.put(`/pedidos/actualizar-estado/${selectedPedido.id}`, {
        estado: nuevoEstado
      });

      if (response.data.success) {
        toast.success(`Pedido #${selectedPedido.id} marcado como ${nuevoEstado}`);
        setMostrarModalDetalle(false);
        cerrarEdicion();
        await cargarPedidos();
      } else {
        toast.error(response.data.message || 'Error al cambiar estado del pedido');
      }
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      toast.error('Error al cambiar estado del pedido');
    }
  };

  const handleRowDoubleClick = useCallback(async (pedido) => {
    try {
      await cargarProductosPedido(pedido);
      setMostrarModalDetalle(true);
    } catch (error) {
      toast.error('Error al cargar detalles del pedido');
    }
  }, [cargarProductosPedido]);

  const handleCloseModalDetalle = useCallback(() => {
    setMostrarModalDetalle(false);
    cerrarEdicion();
  }, [cerrarEdicion]);

  // HANDLERS PARA PRODUCTOS
  const handleAgregarProducto = () => {
    if (bloqueoEdicionOffline) {
      toast.error('Para editar pedidos debes reconectar la app');
      return;
    }
    setMostrarModalDetalle(false);
    setTimeout(() => setMostrarModalAgregarProducto(true), 300);
  };

  const handleEditarProducto = async (producto) => {
  if (bloqueoEdicionOffline) {
    toast.error('Para editar pedidos debes reconectar la app');
    return;
  }
  try {
    console.log('🔍 Abriendo modal para editar:', producto.producto_nombre);
    
    // Consultar stock actual
    const stockActual = await verificarStock(producto.producto_id);
    
    const productoConStock = {
      ...producto,
      stock_actual: stockActual,
      precio: Number(producto.precio) || 0,
      cantidad: Number(producto.cantidad) || 1,
      descuento_porcentaje: Number(producto.descuento_porcentaje) || 0
    };
    
    // Cerrar modal de detalle y abrir modal de edición
    setMostrarModalDetalle(false);
    setProductoEditando(productoConStock);
    
    setTimeout(() => {
      setMostrarModalEditarProducto(true);
    }, 100);
    
  } catch (error) {
    console.error('❌ Error al obtener stock:', error);
    toast.error('Error al consultar stock del producto');
  }
  };

  const handleEliminarProducto = (producto) => {
    if (bloqueoEdicionOffline) {
      toast.error('Para editar pedidos debes reconectar la app');
      return;
    }
    setProductoEliminando(producto);
    setMostrarModalDetalle(false);
    setTimeout(() => setMostrarModalEliminarProducto(true), 300);
  };

  // Handlers para modales de productos
  const handleCloseModalAgregarProducto = () => {
    setMostrarModalAgregarProducto(false);
    setTimeout(() => setMostrarModalDetalle(true), 300);
  };

  const handleCloseModalEditarProducto = () => {
  console.log('🚪 Cerrando modal de editar');
  
  // Cerrar modal y limpiar estado
  setMostrarModalEditarProducto(false);
  setProductoEditando(null);
  
  // Volver al modal de detalle
  setTimeout(() => {
    setMostrarModalDetalle(true);
  }, 100);
  };

  const handleCloseModalEliminarProducto = () => {
    setMostrarModalEliminarProducto(false);
    setProductoEliminando(null);
    setTimeout(() => setMostrarModalDetalle(true), 300);
  };

  const handleProductoChange = (productoModificado) => {
  // Solo actualizar el estado si es necesario
  setProductoEditando(prev => ({
    ...prev,
    ...productoModificado
  }));
  };

  // HANDLERS PARA CONFIRMACIONES
  const handleConfirmarAgregarProducto = async (producto, cantidad) => {
    try {
      console.log('🔄 Agregando producto...');
      
      const exito = await agregarProducto(producto, cantidad);
      if (exito) {
        console.log('✅ Producto agregado exitosamente');
        handleCloseModalAgregarProducto();
        
        console.log('🔄 Recargando lista de pedidos...');
        await cargarPedidos();
        console.log('✅ Lista de pedidos actualizada');
        
        toast.success('Producto agregado correctamente');
      }
      return exito;
    } catch (error) {
      console.error('❌ Error en handleConfirmarAgregarProducto:', error);
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
    console.log('🔄 Guardando producto editado:', productoEditado.producto_nombre);
    
    const exito = await actualizarProducto(productoEditado);
    
    if (exito) {
      console.log('✅ Producto guardado exitosamente');
      
      // ✅ CERRAR MODAL INMEDIATAMENTE
      setMostrarModalEditarProducto(false);
      setProductoEditando(null);
      
      // Mostrar toast de éxito
      toast.success('Producto editado correctamente');
      
      // Recargar datos
      await cargarPedidos();
      
      // Volver al modal de detalle
      setTimeout(() => {
        setMostrarModalDetalle(true);
      }, 200);
    }
  } catch (error) {
    console.error('❌ Error editando producto:', error);
    toast.error('Error al editar producto');
    
    // Cerrar modal incluso si hay error
    setMostrarModalEditarProducto(false);
    setProductoEditando(null);
    
    setTimeout(() => {
      setMostrarModalDetalle(true);
    }, 200);
  }
  };  

  const handleConfirmarEliminarProducto = async () => {
    if (!productoEliminando) return;
    
    try {
      console.log('🔄 Eliminando producto...');
      
      const exito = await eliminarProducto(productoEliminando);
      if (exito) {
        console.log('✅ Producto eliminado exitosamente');
        handleCloseModalEliminarProducto();
        
        console.log('🔄 Recargando lista de pedidos...');
        await cargarPedidos();
        console.log('✅ Lista de pedidos actualizada');
        
        toast.success('Producto eliminado correctamente');
      }
    } catch (error) {
      console.error('❌ Error en handleConfirmarEliminarProducto:', error);
      toast.error('Error al eliminar producto');
    }
  };

  // ✅ FUNCIÓN ADAPTADA para generar PDF individual
  const handleGenerarPDF = async () => {
    if (!selectedPedido || productos.length === 0) {
      toast.error("Seleccione un pedido con productos");
      return;
    }
    
    console.log('🖨️ Generando PDF individual con modal para pedido:', selectedPedido.id);
    await generarPDFPedidoConModal(selectedPedido, productos);
  };

  const handleActualizarObservaciones = async (nuevasObservaciones) => {
    if (!selectedPedido) {
      toast.error('No hay pedido seleccionado');
      return false;
    }

    try {
      console.log('📝 Actualizando observaciones para pedido:', selectedPedido.id);
      const exito = await actualizarObservaciones(nuevasObservaciones);

      if (exito) {
        await cargarPedidos();
        toast.success('Observaciones actualizadas correctamente');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error al actualizar observaciones:', error);
      toast.error('Error al actualizar observaciones');
      return false;
    }
  };

  // Handler para actualizar cliente del pedido
  const handleActualizarClientePedido = async (nuevoCliente) => {
    if (bloqueoEdicionOffline) {
      toast.error('Cambio de cliente no disponible sin conexión');
      throw new Error('Sin conexión');
    }

    if (!selectedPedido) {
      toast.error('No hay pedido seleccionado');
      throw new Error('No hay pedido seleccionado');
    }

    try {
      console.log('🔄 Actualizando cliente del pedido:', selectedPedido.id, 'Nuevo cliente:', nuevoCliente.id);

      const response = await axiosAuth.put(`/pedidos/actualizar-cliente/${selectedPedido.id}`, {
        cliente_id: nuevoCliente.id
      });

      if (response.data.success) {
        toast.success(`Cliente actualizado a: ${nuevoCliente.nombre}`);
        await cargarPedidos();
        // Recargar productos del pedido para actualizar la vista
        await cargarProductosPedido(selectedPedido);
        return true;
      } else {
        toast.error(response.data.message || 'Error al actualizar cliente');
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('❌ Error al actualizar cliente del pedido:', error);
      toast.error('Error al actualizar el cliente del pedido');
      throw error;
    }
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

  const handleConfirmarSalida = useCallback(() => {
    setMostrarConfirmacionSalida(true);
  }, []);

  const handleSelectAll = useCallback(() => {
    handleSelectAllPedidos(pedidos);
  }, [handleSelectAllPedidos, pedidos]);

  const handleSalir = () => {
    window.location.href = '/';
  };

  // Fase 5: callbacks estables para evitar re-renders en hijos
  const handleFiltrosChange = useCallback((nuevosFiltros) => {
    actualizarFiltros(nuevosFiltros); // ya hace refetch con nuevosFiltros y pagina 1
  }, [actualizarFiltros]);

  const handleLimpiarFiltros = useCallback(() => {
    limpiarFiltros(); // ya hace refetch con filtros vacíos en página 1
  }, [limpiarFiltros]);

  /** Tras facturar: actualiza solo ese pedido en lista y cierra el modal (sin recargar toda la lista). Reutilizable para anulación u otras actualizaciones puntuales. */
  const handlePedidoFacturado = useCallback((pedidoId) => {
    actualizarPedidoEnLista(pedidoId, { estado: 'Facturado' });
    cerrarEdicion();
  }, [actualizarPedidoEnLista, cerrarEdicion]);

  // Obtener estadísticas para mostrar en filtros
  const estadisticas = getEstadisticas();

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

  // Función para obtener el título dinámico
  const getTitulo = () => {
    if (user?.rol === 'GERENTE') {
      return 'HISTORIAL DE PEDIDOS - TODOS LOS PEDIDOS';
    }
    return `HISTORIAL DE PEDIDOS - ${user?.nombre?.toUpperCase() || 'MIS PEDIDOS'}`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Head>
        <title>VERTIMAR | HISTORIAL DE PEDIDOS</title>
        <meta name="description" content="Historial de pedidos en el sistema VERTIMAR" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      {/* Contenido scrolleable: evita que la página quede bloqueada en móvil (Fase 4) */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-8">
        <div className="flex flex-col items-center max-w-6xl mx-auto w-full">
          <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6 w-full">
            <h1 className="text-xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center text-gray-800">
              {getTitulo()}
            </h1>

            <FiltrosHistorialPedidos
              filtros={filtros}
              onFiltrosChange={handleFiltrosChange}
              onLimpiarFiltros={handleLimpiarFiltros}
              user={user}
              totalPedidos={estadisticas.total}
              pedidosFiltrados={estadisticas.filtrado}
              pedidosOriginales={pedidosOriginales}
            />

            <TablaPedidos
              pedidos={pedidos}
              selectedPedidos={selectedPedidos}
              onSelectPedido={handleSelectPedido}
              onSelectAll={handleSelectAll}
              onRowDoubleClick={handleRowDoubleClick}
              loading={loading}
              mostrarPermisos={true}
              verificarPermisos={() => true}
              isPedidoFacturado={selectedPedido?.estado === 'Facturado'}
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
              contexto="historial"
              selectedPedidos={selectedPedidos}
              onImprimirMultiple={handleImprimirMultiple}
              onVolverMenu={handleConfirmarSalida}
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
          </div>
        </div>
      </main>

      {/* MODALES CON PROPS ADAPTADAS PARA PDF */}
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
        mostrarModalFacturacion={mostrarModalFacturacion}
        setMostrarModalFacturacion={setMostrarModalFacturacion}
        onActualizarObservaciones={handleActualizarObservaciones}
        onActualizarClientePedido={handleActualizarClientePedido}
        isPedidoFacturado={selectedPedido?.estado === 'Facturado'}
        isPedidoAnulado={selectedPedido?.estado === 'Anulado'}
        // ✅ Props para modal PDF individual
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

      <ModalAgregarProductoPedido
        mostrar={mostrarModalAgregarProducto}
        onClose={handleCloseModalAgregarProducto}
        onAgregarProducto={handleConfirmarAgregarProducto}
        productosActuales={productos}
      />

      <ModalEditarProductoPedido
        producto={productoEditando}
        onClose={handleCloseModalEditarProducto}
        onGuardar={handleConfirmarEditarProducto} // Recibe el producto editado como parámetro
        onChange={handleProductoChange} // Para actualizar el estado local
      />

      <ModalEliminarProductoPedido
        producto={productoEliminando}
        onClose={handleCloseModalEliminarProducto}
        onConfirmar={handleConfirmarEliminarProducto}
      />

      <ModalConfirmacionSalidaPedidos
        mostrar={mostrarConfirmacionSalida}
        onConfirmar={handleSalir}
        onCancelar={() => setMostrarConfirmacionSalida(false)}
      />

      <ModalConfirmacionAnularPedidoIndividual
        mostrar={mostrarModalAnularPedido}
        pedido={pedidoParaAnular}
        productos={productos}
        onConfirmar={handleAnularPedidoIndividual}
        onCancelar={() => {
          setMostrarModalAnularPedido(false);
          setPedidoParaAnular(null);
        }}
        loading={loadingAnular}
      />
    </div>
  );
}

export default function HistorialPedidos() {
  return <HistorialPedidosContent />;
}