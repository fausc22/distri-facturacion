// components/notas/ModalCrearNota.jsx
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { NotasProvider, useNotasContext } from '../../context/NotasContext';
import { useNotas } from '../../hooks/notas/useNotas';
import useAuth from '../../hooks/useAuth';
import { axiosAuth } from '../../utils/apiClient';

// Componentes reutilizados
import ClienteSelector from '../pedidos/SelectorClientes';
import ProductoSelector from '../pedidos/SelectorProductos';
import ProductosCarrito from '../pedidos/ProductosCarrito';
import ObservacionesPedido from '../pedidos/ObservacionesPedido';

// Componentes específicos de notas
import { ModalFacturacionNota } from './ModalFacturacionNota';
import { ModalBuscarVenta } from './ModalBuscarVenta';
import { ModalProductoManual } from './ModalProductoManual';
import ModalBase from '../common/ModalBase';
import { Z_INDEX } from '../../constants/zIndex';

function ModalCrearNotaContent({ tipoNota, mostrar, onClose, onNotaCreada }) {
  const { user } = useAuth();
  const { buscarVentas, crearNota, loading } = useNotas();
  const {
    cliente,
    ventaReferencia,
    productos,
    observaciones,
    subtotal,
    totalIva,
    total,
    setCliente,
    setVentaReferencia,
    clearCliente,
    clearVentaReferencia,
    clearNota,
    getDatosNota
  } = useNotasContext();

  const [mostrarModalVenta, setMostrarModalVenta] = useState(false);
  const [mostrarModalFacturacion, setMostrarModalFacturacion] = useState(false);
  const [mostrarModalProductoManual, setMostrarModalProductoManual] = useState(false);
  const [modoCreacion, setModoCreacion] = useState(null); // 'con_referencia' o 'sin_referencia'

  // Inicializar cuando se abre el modal
  useEffect(() => {
    if (mostrar) {
      clearNota();
      setModoCreacion(null);
    }
  }, [mostrar]);

  // Si hay venta de referencia, cargar cliente completo desde la base de datos
  useEffect(() => {
    const cargarClienteCompleto = async () => {
      if (ventaReferencia && ventaReferencia.cliente_id && !cliente) {
        try {
          // ✅ Obtener cliente completo desde la base de datos usando cliente_id
          const response = await axiosAuth.get(`/personas/cliente/${ventaReferencia.cliente_id}`);
          
          if (response.data.success && response.data.data) {
            const clienteCompleto = response.data.data;
            
            // ✅ Establecer cliente con TODOS los datos desde la tabla clientes
            setCliente({
              id: clienteCompleto.id,
              nombre: clienteCompleto.nombre,
              telefono: clienteCompleto.telefono || '',
              direccion: clienteCompleto.direccion || '',
              ciudad: clienteCompleto.ciudad || '',
              provincia: clienteCompleto.provincia || '',
              condicion_iva: clienteCompleto.condicion_iva || '', // ✅ Esto es lo importante
              cuit: clienteCompleto.cuit || '',
              dni: clienteCompleto.dni || '',
              email: clienteCompleto.email || ''
            });
            
            console.log('✅ Cliente cargado desde BD:', clienteCompleto);
          } else {
            // Si no se encuentra en clientes, usar datos de la venta como fallback
            console.warn('⚠️ Cliente no encontrado en tabla clientes, usando datos de venta');
            setCliente({
              id: ventaReferencia.cliente_id,
              nombre: ventaReferencia.cliente_nombre,
              telefono: ventaReferencia.cliente_telefono || '',
              direccion: ventaReferencia.cliente_direccion || '',
              ciudad: ventaReferencia.cliente_ciudad || '',
              provincia: ventaReferencia.cliente_provincia || '',
              condicion_iva: ventaReferencia.cliente_condicion || '',
              cuit: ventaReferencia.cliente_cuit || ''
            });
          }
        } catch (error) {
          console.error('Error cargando cliente completo:', error);
          // Fallback: usar datos de la venta
          setCliente({
            id: ventaReferencia.cliente_id,
            nombre: ventaReferencia.cliente_nombre,
            telefono: ventaReferencia.cliente_telefono || '',
            direccion: ventaReferencia.cliente_direccion || '',
            ciudad: ventaReferencia.cliente_ciudad || '',
            provincia: ventaReferencia.cliente_provincia || '',
            condicion_iva: ventaReferencia.cliente_condicion || '',
            cuit: ventaReferencia.cliente_cuit || ''
          });
        }
      }
    };

    cargarClienteCompleto();
  }, [ventaReferencia]);

  const handleSeleccionarVenta = (venta) => {
    setVentaReferencia(venta);
    setMostrarModalVenta(false);
    setModoCreacion('con_referencia');
    toast.success(`Venta ${venta.numero_factura} seleccionada como referencia`);
  };

  const handleCrearSinReferencia = () => {
    clearVentaReferencia();
    setModoCreacion('sin_referencia');
  };

  const handleContinuarAFacturacion = () => {
    if (!ventaReferencia && !cliente) {
      toast.error('Debe seleccionar una venta de referencia o un cliente');
      return;
    }

    if (productos.length === 0) {
      toast.error('Debe agregar al menos un producto');
      return;
    }

    setMostrarModalFacturacion(true);
  };

  const handleConfirmarNota = async (datosFacturacion) => {
    const datosNota = getDatosNota();
    
    const datosCompletos = {
      ...datosNota,
      cuentaId: datosFacturacion.cuentaId,
      tipoFiscal: datosFacturacion.tipoFiscal,
      ...datosFacturacion
    };

    console.log(`💰 Creando ${tipoNota}:`, datosCompletos);
    
    const resultado = await crearNota(tipoNota, datosCompletos);
    
    if (resultado.success) {
      clearNota();
      setMostrarModalFacturacion(false);
      onNotaCreada();
      onClose();
    }
  };

  const handleAgregarProductoManual = () => {
    setMostrarModalProductoManual(true);
  };

  const {
    addProducto
  } = useNotasContext();

  const handleProductoManualCreado = (productoManual) => {
    // Agregar producto manual al contexto
    addProducto(productoManual, productoManual.cantidad);
    
    setMostrarModalProductoManual(false);
    toast.success('Producto manual agregado');
  };

  if (!mostrar) return null;

  const titulo = tipoNota === 'NOTA_DEBITO' ? 'NUEVA NOTA DE DÉBITO' : 'NUEVA NOTA DE CRÉDITO';
  const colorBoton = tipoNota === 'NOTA_DEBITO' ? 'blue' : 'red';

  return (
    <>
      <ModalBase
        isOpen={mostrar}
        onClose={onClose}
        title={titulo}
        size="2xl"
        closeOnOverlay
        closeOnEscape
        zIndex={Z_INDEX.MODAL_BASE}
        panelClassName="w-full max-w-6xl max-h-[95vh] p-4 sm:p-6"
        showHeader={false}
      >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                {titulo}
              </h2>
              <button 
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-xl p-1 min-h-[44px] min-w-[44px] transition-transform active:scale-95"
                aria-label="Cerrar modal de nota"
              >
                ✕
              </button>
            </div>

            {/* Paso 1: Seleccionar modo de creación */}
            {!modoCreacion && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-4 text-gray-800">Seleccione el modo de creación:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => setMostrarModalVenta(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg font-semibold transition-colors"
                  >
                    📋 Seleccionar Venta de Referencia
                  </button>
                  <button
                    onClick={handleCrearSinReferencia}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-lg font-semibold transition-colors"
                  >
                    ➕ Crear sin Referencia
                  </button>
                </div>
              </div>
            )}

            {/* Si hay venta de referencia, mostrarla */}
            {ventaReferencia && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-blue-800">Venta de Referencia:</h3>
                    <p className="text-sm text-blue-700">
                      {ventaReferencia.numero_factura} - {ventaReferencia.cliente_nombre}
                    </p>
                    <p className="text-xs text-blue-600">
                      Total: ${ventaReferencia.total}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      clearVentaReferencia();
                      setModoCreacion(null);
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Cambiar
                  </button>
                </div>
              </div>
            )}

            {/* Si no hay referencia, mostrar selector de cliente */}
            {modoCreacion === 'sin_referencia' && !cliente && (
              <div className="mb-6">
                <h3 className="font-semibold mb-4 text-gray-800">Seleccione el Cliente:</h3>
                <ClienteSelector />
              </div>
            )}

            {/* Información del cliente (si está seleccionado) */}
            {cliente && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-green-800">Cliente:</h3>
                    <p className="text-sm text-green-700">{cliente.nombre}</p>
                    <p className="text-xs text-green-600">
                      {cliente.ciudad} - {cliente.condicion_iva}
                    </p>
                  </div>
                  {modoCreacion === 'sin_referencia' && (
                    <button
                      onClick={clearCliente}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Cambiar
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Selector de productos */}
            {(ventaReferencia || cliente) && (
              <>
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-800">Agregar Productos:</h3>
                    <button
                      onClick={handleAgregarProductoManual}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
                    >
                      ➕ Producto Manual
                    </button>
                  </div>
                  <ProductoSelector mostrarPreciosConIva />
                </div>

                {/* Carrito de productos */}
                <ProductosCarrito />

                {/* Observaciones */}
                <ObservacionesPedido />

                {/* Resumen y botones */}
                <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                    <div className="text-lg font-semibold text-gray-800 mb-2 sm:mb-0">
                      <p>Total de productos: <span className="text-blue-600">{productos.length}</span></p>
                      <p>Total de la nota: <span className="text-green-600">${total.toFixed(2)}</span></p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row justify-end gap-4">
                    <button 
                      className={`px-6 py-3 rounded text-white font-semibold transition-colors ${
                        loading 
                          ? 'bg-gray-500 cursor-not-allowed' 
                          : `bg-${colorBoton}-600 hover:bg-${colorBoton}-700`
                      }`}
                      onClick={handleContinuarAFacturacion}
                      disabled={loading || productos.length === 0}
                    >
                      {loading ? 'Procesando...' : `💰 CREAR ${titulo}`}
                    </button>
                    <button 
                      onClick={onClose}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded font-semibold transition-colors"
                      disabled={loading}
                    >
                      CANCELAR
                    </button>
                  </div>
                </div>
              </>
            )}
      </ModalBase>

      {/* Modal de buscar venta */}
      <ModalBuscarVenta
        mostrar={mostrarModalVenta}
        onClose={() => setMostrarModalVenta(false)}
        onSeleccionarVenta={handleSeleccionarVenta}
        buscarVentas={buscarVentas}
      />

      {/* Modal de facturación */}
      <ModalFacturacionNota
        mostrar={mostrarModalFacturacion}
        onClose={() => setMostrarModalFacturacion(false)}
        tipoNota={tipoNota}
        cliente={cliente || (ventaReferencia ? {
          condicion_iva: ventaReferencia.cliente_condicion
        } : null)}
        productos={productos}
        onConfirmarNota={handleConfirmarNota}
      />

      {/* Modal de producto manual */}
      <ModalProductoManual
        mostrar={mostrarModalProductoManual}
        onClose={() => setMostrarModalProductoManual(false)}
        onGuardar={handleProductoManualCreado}
      />
    </>
  );
}

export function ModalCrearNota({ tipoNota, mostrar, onClose, onNotaCreada }) {
  return (
    <NotasProvider>
      <ModalCrearNotaContent
        tipoNota={tipoNota}
        mostrar={mostrar}
        onClose={onClose}
        onNotaCreada={onNotaCreada}
      />
    </NotasProvider>
  );
}

