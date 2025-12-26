// components/pedidos/ModalesHistorialPedidos.jsx - Versión corregida con descuentos funcionando
import { useState, useEffect } from 'react';
import { MdDeleteForever, MdExpandMore, MdExpandLess, MdSearch } from "react-icons/md";
import { toast } from 'react-hot-toast';
import { usePedidos } from '../../hooks/pedidos/usePedidos';
import { useProductoSearch } from 'hooks/useBusquedaProductos';
import useAuth from '../../hooks/useAuth';
import { useFacturacion } from '../../hooks/pedidos/useFacturacion';
import { ModalPDFUniversal, BotonGenerarPDFUniversal } from '../shared/ModalPDFUniversal';
import { ModalFacturacion } from './ModalFacturacion';

// ✅ MODAL DE DESCUENTOS CORREGIDO - APLICA % SOBRE SUBTOTAL
export function ModalDescuentos({
  mostrar, 
  onClose, 
  onAplicarDescuento, 
  subtotalSinIva = 0, 
  ivaTotal = 0, 
  totalConIva = 0 
}) {
  const [tipoDescuento, setTipoDescuento] = useState('numerico');
  const [valorDescuento, setValorDescuento] = useState('');
  const [descuentoCalculado, setDescuentoCalculado] = useState(0);

  useEffect(() => {
    if (!valorDescuento || valorDescuento === '') {
      setDescuentoCalculado(0);
      return;
    }

    const valor = parseFloat(valorDescuento) || 0;
    
    if (tipoDescuento === 'numerico') {
      // Descuento directo sobre el total con IVA
      setDescuentoCalculado(Math.min(valor, totalConIva || 0));
    } else {
      // ✅ CORREGIDO: Porcentaje sobre el SUBTOTAL (importe neto)
      const porcentaje = Math.min(Math.max(valor, 0), 100);
      setDescuentoCalculado(((subtotalSinIva || 0) * porcentaje) / 100);
    }
  }, [valorDescuento, tipoDescuento, subtotalSinIva, totalConIva]);

  const handleAplicar = () => {
    if (descuentoCalculado > 0) {
      onAplicarDescuento({
        tipo: tipoDescuento,
        valor: parseFloat(valorDescuento) || 0,
        descuentoCalculado: descuentoCalculado
      });
    }
    onClose();
  };

  const limpiarFormulario = () => {
    setTipoDescuento('numerico');
    setValorDescuento('');
    setDescuentoCalculado(0);
  };

  const handleClose = () => {
    limpiarFormulario();
    onClose();
  };

  if (!mostrar) return null;

  const nuevoTotal = (totalConIva || 0) - descuentoCalculado;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[70] p-2 sm:p-4">
      <div className="bg-white rounded-lg max-w-xs sm:max-w-md w-full">
        <div className="p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold mb-4 text-center">Aplicar Descuento</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de descuento:
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="tipoDescuento"
                  value="numerico"
                  checked={tipoDescuento === 'numerico'}
                  onChange={(e) => setTipoDescuento(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm">💰 Descuento numérico (en pesos)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="tipoDescuento"
                  value="porcentaje"
                  checked={tipoDescuento === 'porcentaje'}
                  onChange={(e) => setTipoDescuento(e.target.value)}
                  className="mr-2"
                />
                {/* ✅ CORREGIDO: Texto actualizado */}
                <span className="text-sm">📊 Descuento porcentual (% sobre subtotal)</span>
              </label>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {tipoDescuento === 'numerico' ? 'Monto a descontar ($):' : 'Porcentaje (1-100%):'}
            </label>
            <div className="flex items-center">
              {tipoDescuento === 'numerico' && <span className="mr-2 text-gray-600">$</span>}
              <input
                type="number"
                value={valorDescuento}
                onChange={(e) => setValorDescuento(e.target.value)}
                min="0"
                max={tipoDescuento === 'numerico' ? (totalConIva || 0) : 100}
                step={tipoDescuento === 'numerico' ? '0.01' : '1'}
                className="border p-2 rounded w-full text-sm"
                placeholder={tipoDescuento === 'numerico' ? '0.00' : '0'}
              />
              {tipoDescuento === 'porcentaje' && <span className="ml-2 text-gray-600">%</span>}
            </div>
            {tipoDescuento === 'porcentaje' && (
              <p className="text-xs text-gray-500 mt-1">
                {/* ✅ CORREGIDO: Texto explicativo actualizado */}
                Se aplicará sobre el subtotal (importe neto): ${(subtotalSinIva || 0).toFixed(2)}
              </p>
            )}
          </div>

          {descuentoCalculado > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <h4 className="font-medium text-sm mb-2">Vista previa del descuento:</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Subtotal (neto):</span>
                  <span>${(subtotalSinIva || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IVA:</span>
                  <span>${(ivaTotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total original:</span>
                  <span>${(totalConIva || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Descuento:</span>
                  <span>-${descuentoCalculado.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-1">
                  <span>Total final:</span>
                  <span className="text-green-600">${nuevoTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleAplicar}
              disabled={!valorDescuento || valorDescuento === '' || parseFloat(valorDescuento) <= 0}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded transition-colors text-sm w-full sm:w-auto"
            >
              ✅ Aplicar Descuento
            </button>
            <button
              onClick={handleClose}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors text-sm w-full sm:w-auto"
            >
              ❌ Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


// ✅ FUNCIÓN PARA DETERMINAR TIPO FISCAL SEGÚN CONDICIÓN IVA
const determinarTipoFiscal = (condicionIva) => {
  if (!condicionIva || typeof condicionIva !== 'string') {
    return 'C'; // Por defecto Consumidor Final
  }

  const condicion = condicionIva.trim();
  
  // Mapeo exacto de condiciones IVA a tipos fiscales
  switch (condicion) {
    case 'Responsable Inscripto':
      return 'A';
    case 'Responsable No Inscripto':
    case 'Monotributo':
      return 'B';
    case 'Consumidor Final':
    case 'Exento':
      return 'C';
    default:
      return 'C'; // Por defecto
  }
};

// ✅ MODAL DE FACTURACIÓN CORREGIDO


// ✅ RESTO DE COMPONENTES SIN CAMBIOS (InformacionCliente, etc.)
import ModalEditarClientePedido from './ModalEditarClientePedido';

export function InformacionCliente({
  pedido,
  expandido,
  onToggleExpansion,
  mostrarModalFacturacion,
  setMostrarModalFacturacion,
  productos,
  handleConfirmarFacturacion,
  cuentas = [],
  cargandoCuentas = false,
  onActualizarClientePedido,
  isPedidoAnulado = false,
  isPedidoFacturado = false // ✅ AGREGAR PROP
}) {
  const [mostrarModalEditarCliente, setMostrarModalEditarCliente] = useState(false);
  const [clienteActualizado, setClienteActualizado] = useState(null);

  // Usar cliente actualizado si existe, sino usar el del pedido
  const clienteMostrar = clienteActualizado || {
    id: pedido.cliente_id,
    nombre: pedido.cliente_nombre,
    direccion: pedido.cliente_direccion,
    ciudad: pedido.cliente_ciudad,
    provincia: pedido.cliente_provincia,
    condicion_iva: pedido.cliente_condicion,
    cuit: pedido.cliente_cuit,
    telefono: pedido.cliente_telefono
  };

  const handleClienteSeleccionado = (nuevoCliente) => {
    setClienteActualizado(nuevoCliente);
  };

  // ✅ Determinar si se puede editar
  const puedeEditar = !isPedidoAnulado && !isPedidoFacturado;

  return (
    <div className="bg-blue-50 rounded-lg overflow-hidden mb-4">
      <div
        className="p-3 cursor-pointer hover:bg-blue-100 transition-colors flex items-center justify-between"
        onClick={onToggleExpansion}
      >
        <div className="flex-1">
          <h3 className="font-bold text-lg text-blue-800">Cliente: {clienteMostrar.nombre}</h3>
          <p className="text-blue-600 text-sm">
            {clienteMostrar.ciudad || 'Ciudad no especificada'}
            {clienteMostrar.provincia && `, ${clienteMostrar.provincia}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Botón para editar cliente - ✅ BLOQUEADO SI ESTÁ FACTURADO */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (puedeEditar) {
                setMostrarModalEditarCliente(true);
              }
            }}
            disabled={!puedeEditar}
            className={`px-3 py-1 rounded text-sm transition-colors flex items-center gap-1 ${
              puedeEditar 
                ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            title={
              isPedidoFacturado 
                ? '🔒 No editable - Pedido facturado' 
                : isPedidoAnulado
                  ? '🔒 No editable - Pedido anulado'
                  : 'Cambiar cliente'
            }
          >
            {puedeEditar ? '✏️' : '🔒'} <span className="hidden sm:inline">{puedeEditar ? 'Editar' : 'Bloqueado'}</span>
          </button>
          <div className="text-blue-600">
            {expandido ? <MdExpandLess size={24} /> : <MdExpandMore size={24} />}
          </div>
        </div>
      </div>
      <div className={`transition-all duration-300 ease-in-out ${
        expandido ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      } overflow-hidden`}>
        <div className="px-3 pb-3 border-t border-blue-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mt-3">
            <div>
              <span className="font-medium text-blue-700">Dirección:</span>
              <p className="text-gray-700">{clienteMostrar.direccion || 'No especificada'}</p>
            </div>
            <div>
              <span className="font-medium text-blue-700">Condición IVA:</span>
              <p className="text-gray-700">{clienteMostrar.condicion_iva || 'No especificada'}</p>
            </div>
            <div>
              <span className="font-medium text-blue-700">CUIT:</span>
              <p className="text-gray-700">{clienteMostrar.cuit || 'No especificado'}</p>
            </div>
            <div>
              <span className="font-medium text-blue-700">Teléfono:</span>
              <p className="text-gray-700">{clienteMostrar.telefono || 'No especificado'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ USAR EL MODAL NUEVO SEPARADO */}
      <ModalFacturacion
        mostrar={mostrarModalFacturacion}
        onClose={() => setMostrarModalFacturacion(false)}
        pedido={pedido}
        productos={productos}
        cuentas={cuentas}
        cargandoCuentas={cargandoCuentas}
        onConfirmarFacturacion={handleConfirmarFacturacion}
      />

      {/* Modal para editar/cambiar cliente */}
      <ModalEditarClientePedido
        isOpen={mostrarModalEditarCliente}
        onClose={() => setMostrarModalEditarCliente(false)}
        clienteActual={clienteMostrar}
        onClienteSeleccionado={handleClienteSeleccionado}
        onActualizarPedido={onActualizarClientePedido}
      />
    </div>
  );
}

export function InformacionAdicional({ 
  pedido, 
  onActualizarObservaciones, 
  canEdit = true 
}) {
  const [editandoObservaciones, setEditandoObservaciones] = useState(false);
  const [observacionesTemp, setObservacionesTemp] = useState('');
  const [guardandoObservaciones, setGuardandoObservaciones] = useState(false);

  const getEstadoStyle = (estado) => {
    switch (estado) {
      case 'Exportado':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Facturado':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Anulado':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const iniciarEdicionObservaciones = () => {
    setObservacionesTemp(pedido.observaciones || '');
    setEditandoObservaciones(true);
  };

  const cancelarEdicionObservaciones = () => {
    setObservacionesTemp('');
    setEditandoObservaciones(false);
  };

  const guardarObservaciones = async () => {
    setGuardandoObservaciones(true);
    
    try {
      const exito = await onActualizarObservaciones(observacionesTemp);
      if (exito) {
        setEditandoObservaciones(false);
        setObservacionesTemp('');
        toast.success('Observaciones actualizadas correctamente');
      }
    } catch (error) {
      toast.error('Error al actualizar observaciones');
    } finally {
      setGuardandoObservaciones(false);
    }
  };

  const handleKeyDown = (e) => {
    // Ctrl/Cmd + Enter para guardar rápido
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      guardarObservaciones();
    }
    // Escape para cancelar
    if (e.key === 'Escape') {
      e.preventDefault();
      cancelarEdicionObservaciones();
    }
  };

  return (
    <div className="bg-gray-100 p-4 rounded-lg mb-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Estado */}
        <div>
          <h3 className="font-bold text-xl mb-2 text-gray-800">Estado</h3>
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getEstadoStyle(pedido.estado)}`}>
            {pedido.estado || 'Sin estado'}
          </span>
        </div>

        {/* Observaciones - Responsivo y Editable SIN HOVER MOLESTO */}
        <div className="md:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-xl text-gray-800">Observaciones</h3>
            {canEdit && !editandoObservaciones && (
              <button
                onClick={iniciarEdicionObservaciones}
                className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs transition-colors flex items-center gap-1"
                title="Editar observaciones"
              >
                ✏️ <span className="hidden sm:inline">Editar</span>
              </button>
            )}
            {!canEdit && (
              <span className="bg-gray-300 text-gray-500 px-2 py-1 rounded text-xs flex items-center gap-1 cursor-not-allowed" title="No editable - Pedido facturado">
                🔒 <span className="hidden sm:inline">Bloqueado</span>
              </span>
            )}
          </div>

          {editandoObservaciones ? (
            <div className="space-y-2">
              <textarea
                value={observacionesTemp}
                onChange={(e) => setObservacionesTemp(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escriba las observaciones del pedido..."
                className="w-full p-2 border border-gray-300 rounded text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
                maxLength="500"
                disabled={guardandoObservaciones}
              />
              
              {/* Contador de caracteres */}
              <div className="text-xs text-gray-500 text-right">
                {observacionesTemp.length}/500 caracteres
              </div>
              
              {/* Botones de acción - Responsivos */}
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={guardarObservaciones}
                  disabled={guardandoObservaciones}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-3 py-1 rounded text-sm transition-colors flex items-center justify-center gap-1"
                >
                  {guardandoObservaciones ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      <span className="hidden sm:inline">Guardando...</span>
                    </>
                  ) : (
                    <>
                      ✅ <span className="hidden sm:inline">Guardar</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={cancelarEdicionObservaciones}
                  disabled={guardandoObservaciones}
                  className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm transition-colors flex items-center justify-center gap-1"
                >
                  ❌ <span className="hidden sm:inline">Cancelar</span>
                </button>
              </div>
              
              {/* Ayuda de teclado */}
              <div className="text-xs text-gray-500 hidden sm:block">
                💡 Ctrl+Enter para guardar, Escape para cancelar
              </div>
            </div>
          ) : (
            // ✅ VERSIÓN SIN HOVER MOLESTO - Solo el contenido simple
            <div>
              <p className="text-lg text-gray-700 bg-white p-3 rounded border min-h-[2.5rem] break-words">
                {pedido.observaciones && pedido.observaciones !== 'sin observaciones' 
                  ? pedido.observaciones 
                  : (
                    <span className="text-gray-400 italic">
                      Sin observaciones especiales
                    </span>
                  )
                }
              </p>
            </div>
          )}
        </div>

        {/* Empleado */}
        <div>
          <h3 className="font-bold text-xl mb-2 text-gray-800">Usuario</h3>
          <p className="text-lg font-semibold text-blue-600">
            {pedido.empleado_nombre || 'No especificado'}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ModalAgregarProductoPedido({ 
  mostrar, 
  onClose, 
  onAgregarProducto,
  productosActuales = []
}) {
  const [productQuantity, setProductQuantity] = useState(0.5); // ← INICIAR EN 0.5
  const [agregandoProducto, setAgregandoProducto] = useState(false);
  
  const {
    busqueda,
    setBusqueda,
    resultados,
    productoSeleccionado,
    loading,
    buscarProducto,
    seleccionarProducto,
    limpiarSeleccion
  } = useProductoSearch();

  // Función para formatear cantidad
  const formatearCantidad = (cantidad) => {
    const cantidadNum = parseFloat(cantidad);
    return cantidadNum % 1 === 0 ? cantidadNum.toString() : cantidadNum.toFixed(1);
  };

  // Manejar cambio de cantidad con decimales
  const handleCantidadChange = (nuevaCantidad) => {
    let cantidadFloat = parseFloat(nuevaCantidad) || 0.5;
    
    // Redondear a medios más cercano
    cantidadFloat = Math.round(cantidadFloat * 2) / 2;
    
    // Aplicar límites
    const cantidadValida = Math.max(0.5, Math.min(stockDisponible, cantidadFloat));
    setProductQuantity(cantidadValida);
  };

  // Incrementar/decrementar en 0.5
  const adjustQuantity = (delta) => {
    if (agregandoProducto) return;
    const nuevaCantidad = productQuantity + delta;
    handleCantidadChange(nuevaCantidad);
  };

  const productoYaExiste = (productoId) => {
    return productosActuales.some(prod => prod.producto_id === productoId);
  };

  const stockDisponible = productoSeleccionado?.stock_actual || 0;
  const stockSuficiente = productQuantity <= stockDisponible;
  const productoEsDuplicado = productoSeleccionado ? productoYaExiste(productoSeleccionado.id) : false;

  const handleAgregarProducto = async () => {
    if (!productoSeleccionado || productQuantity < 0.5) {
      toast.error('Seleccione un producto y una cantidad válida');
      return;
    }

    if (productoEsDuplicado) {
      toast.error(`El producto "${productoSeleccionado.nombre}" ya está en el pedido.`);
      return;
    }

    if (!stockSuficiente) {
      toast.error(`Stock insuficiente. Disponible: ${stockDisponible}, Solicitado: ${productQuantity}`);
      return;
    }

    setAgregandoProducto(true);
    
    try {
      const exito = await onAgregarProducto(productoSeleccionado, productQuantity);
      if (exito) {
        setProductQuantity(0.5);
        limpiarSeleccion();
        onClose();
      }
    } catch (error) {
      console.error('Error agregando producto:', error);
      toast.error('Error al agregar producto');
    } finally {
      setAgregandoProducto(false);
    }
  };

  const handleClose = () => {
    if (agregandoProducto) return;
    
    setProductQuantity(0.5);
    limpiarSeleccion();
    onClose();
  };

  if (!mostrar) return null;

  const precio = Number(productoSeleccionado?.precio) || 0;
  const subtotal = precio * productQuantity;
  const botonDeshabilitado = productoEsDuplicado || !stockSuficiente || agregandoProducto;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 md:p-6">
          <h2 className="text-xl font-bold mb-4 text-center">Buscar Producto</h2>
          
          <div className="flex items-center gap-2 mb-6">
            <input 
              type="text"
              className="border p-2 flex-grow rounded"
              placeholder="Buscar Producto"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              disabled={agregandoProducto}
            />
            <button 
              onClick={buscarProducto}
              disabled={loading || agregandoProducto}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white p-2 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <MdSearch size={24} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded p-4 h-64 md:h-80 overflow-y-auto">
              <h3 className="font-bold mb-2">Productos Encontrados</h3>
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : resultados.length > 0 ? (
                resultados.map((product, index) => {
                  const yaExiste = productoYaExiste(product.id);
                  return (
                    <div 
                      key={index}
                      className={`p-2 border-b transition-colors ${
                        agregandoProducto ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                      } ${
                        productoSeleccionado?.id === product.id ? 'bg-blue-100' : 
                        yaExiste ? 'bg-red-50 opacity-50' : 'hover:bg-gray-100'
                      }`}
                      onClick={() => !yaExiste && !agregandoProducto && seleccionarProducto(product)}
                    >
                      <div className="font-medium text-sm">
                        {product.nombre}
                        {yaExiste && <span className="text-red-600 ml-2">(Ya en pedido)</span>}
                      </div>
                      <div className="text-xs text-gray-600">
                        Código: {product.id} | Stock: {formatearCantidad(product.stock_actual)}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500 text-sm">No hay productos para mostrar</p>
              )}
            </div>
            
            <div className="border rounded p-4">
              <h3 className="font-bold mb-4">Detalles del Producto</h3>
              {productoSeleccionado ? (
                <div className="space-y-3 text-sm">
                  <p><strong>Código:</strong> {productoSeleccionado.id}</p>
                  <p><strong>Nombre:</strong> {productoSeleccionado.nombre}</p>
                  <p><strong>Unidad de Medida:</strong> {productoSeleccionado.unidad_medida}</p>
                  <p><strong>Precio:</strong> ${precio.toFixed(2)}</p>
                  <p><strong>Stock Disponible:</strong> 
                    <span className={stockDisponible > 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatearCantidad(stockDisponible)}
                    </span>
                  </p>
                  
                  {productoEsDuplicado && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded">
                      ⚠️ Este producto ya está en el pedido
                    </div>
                  )}
                  
                  {agregandoProducto && (
                    <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded">
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        <span>Agregando producto al pedido...</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <label className="block mb-1 font-medium">Cantidad:</label>
                    <div className="flex items-center space-x-2">
                      <button 
                        type="button"
                        disabled={productQuantity <= 0.5 || agregandoProducto}
                        className="bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed text-black w-8 h-8 rounded flex items-center justify-center transition-colors"
                        onClick={() => adjustQuantity(-0.5)}
                      >
                        -
                      </button>
                      <input 
                        type="number"
                        disabled={agregandoProducto}
                        className={`border p-2 w-20 rounded text-sm text-center disabled:bg-gray-100 disabled:cursor-not-allowed ${
                          !stockSuficiente ? 'border-red-500 bg-red-50' : ''
                        }`}
                        value={productQuantity}
                        onChange={(e) => handleCantidadChange(e.target.value)}
                        min="0.5"
                        step="0.5"
                        max={stockDisponible}
                      />
                      <button 
                        type="button"
                        disabled={productQuantity >= stockDisponible || agregandoProducto}
                        className="bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed text-black w-8 h-8 rounded flex items-center justify-center transition-colors"
                        onClick={() => adjustQuantity(0.5)}
                      >
                        +
                      </button>
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-1">
                      Cantidad: {formatearCantidad(productQuantity)} (mínimo 0.5)
                    </p>
                    
                    {!stockSuficiente && (
                      <p className="text-red-600 text-xs mt-1">
                        ❌ Stock insuficiente (máximo: {formatearCantidad(stockDisponible)})
                      </p>
                    )}
                  </div>
                  
                  <div className="bg-gray-100 p-3 rounded">
                    <p className="font-semibold">Subtotal (sin IVA): ${subtotal.toFixed(2)}</p>
                  </div>
                  
                  <button 
                    onClick={handleAgregarProducto}
                    disabled={botonDeshabilitado}
                    className={`mt-4 px-4 py-2 rounded w-full transition-colors flex items-center justify-center gap-2 ${
                      botonDeshabilitado
                        ? 'bg-gray-400 cursor-not-allowed text-gray-700'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {agregandoProducto && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    )}
                    
                    {agregandoProducto 
                      ? 'Agregando...'
                      : productoEsDuplicado 
                        ? 'Producto ya agregado' 
                        : !stockSuficiente 
                          ? 'Stock insuficiente'
                          : `Agregar ${formatearCantidad(productQuantity)} unidades`
                    }
                  </button>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Seleccione un producto de la lista</p>
              )}
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <button 
              onClick={handleClose}
              disabled={agregandoProducto}
              className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded transition-colors"
            >
              {agregandoProducto ? 'Procesando...' : 'Cancelar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ModalEditarProductoPedido({ 
  producto, 
  onClose, 
  onGuardar,
  onChange
}) {
  // ✅ TODOS LOS HOOKS AL INICIO - ORDEN FIJO
  const { user } = useAuth();
  const [localCantidad, setLocalCantidad] = useState(1);
  const [localPrecio, setLocalPrecio] = useState(0);
  const [localDescuento, setLocalDescuento] = useState(0);
  const [localNombre, setLocalNombre] = useState('');
  const [editandoNombre, setEditandoNombre] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [inicializado, setInicializado] = useState(false);

  // ✅ CONSTANTE CALCULADA
  const esGerente = user?.rol === 'GERENTE';

  // ✅ EFFECT 1: Inicialización cuando cambia producto
  useEffect(() => {
    console.log('🔄 Effect inicialización, producto:', producto?.producto_nombre);
    
    if (producto) {
      // ✅ Resetear estado cuando cambia el producto
      if (producto.id !== producto?.id || !inicializado) {
        console.log('📝 Inicializando valores del modal');
        setLocalCantidad(Math.max(0.5, parseFloat(producto.cantidad) || 0.5));
        setLocalPrecio(Number(producto.precio) || 0);
        setLocalDescuento(Number(producto.descuento_porcentaje) || 0);
        setLocalNombre(producto.producto_nombre || '');
        setEditandoNombre(false); // ✅ Asegurar que siempre empiece en false
        setGuardando(false);
        setInicializado(true);
      }
    } else {
      setInicializado(false);
      setEditandoNombre(false);
    }
  }, [producto, inicializado]);

  // ✅ EFFECT 2: Cleanup cuando se desmonta
  useEffect(() => {
    return () => {
      console.log('🧹 Limpiando modal al desmontar');
      setGuardando(false);
      setInicializado(false);
    };
  }, []);

  // ✅ EFFECT 3: Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !guardando) {
        onClose();
      }
    };

    if (producto) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [producto, guardando, onClose]);

  // ✅ EARLY RETURN DESPUÉS DE TODOS LOS HOOKS
  if (!producto || !inicializado) {
    return null;
  }

  // ✅ CÁLCULOS Y VALORES
  const stockDisponible = Number(producto.stock_actual) || 0;
  const stockSuficiente = localCantidad <= stockDisponible;
  const subtotalBase = localCantidad * localPrecio;
  const montoDescuento = (subtotalBase * localDescuento) / 100;
  const subtotalFinal = subtotalBase - montoDescuento;
  const botonesDeshabilitados = !stockSuficiente || localPrecio <= 0 || guardando;

  // ✅ HANDLERS (NO SON HOOKS)
  const handleCantidadInput = (e) => {
      if (guardando) return;
      let valor = parseFloat(e.target.value) || 0.5; // ← CAMBIAR A parseFloat Y 0.5
      
      // Redondear a medios más cercano
      valor = Math.round(valor * 2) / 2;
      
      const valorValido = Math.max(0.5, Math.min(stockDisponible, valor)); // ← MÍNIMO 0.5
      
      if (valor > stockDisponible) {
        toast.error(`Stock insuficiente. Máximo: ${stockDisponible}`);
      }
      
      setLocalCantidad(valorValido);
    };

    const handleCantidadBoton = (incremento) => {
      if (guardando) return;
      
      // Incremento de 0.5 en lugar de 1
      const nuevoIncremento = incremento > 0 ? 0.5 : -0.5; // ← CAMBIAR A 0.5
      const nuevaCantidad = localCantidad + nuevoIncremento;
      
      // Redondear a medios más cercano
      const cantidadRedondeada = Math.round(nuevaCantidad * 2) / 2;
      
      const valorValido = Math.max(0.5, Math.min(stockDisponible, cantidadRedondeada)); // ← MÍNIMO 0.5
      setLocalCantidad(valorValido);
    };

  const handlePrecioChange = (e) => {
    if (guardando) return;
    const valor = Math.max(0, parseFloat(e.target.value) || 0);
    setLocalPrecio(valor);
  };

  const handleDescuentoChange = (e) => {
    if (guardando) return;
    const valor = Math.max(0, Math.min(100, parseFloat(e.target.value) || 0));
    setLocalDescuento(valor);
  };

  const handleEditarNombre = () => {
    if (guardando) return;
    setEditandoNombre(true);
  };

  const handleCancelarEdicionNombre = () => {
    setLocalNombre(producto.producto_nombre || '');
    setEditandoNombre(false);
  };

  const handleGuardarNombre = () => {
    if (!localNombre.trim()) {
      toast.error('El nombre no puede estar vacío');
      return;
    }
    setEditandoNombre(false);
  };

  const handleGuardarClick = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    if (guardando) {
      console.log('⚠️ Ya guardando, ignorando');
      return;
    }

    if (!stockSuficiente) {
      toast.error(`Stock insuficiente. Disponible: ${stockDisponible}`);
      return;
    }

    if (localPrecio <= 0) {
      toast.error('El precio debe ser mayor a cero');
      return;
    }

    setGuardando(true);

    try {
      const productoActualizado = {
        ...producto,
        cantidad: localCantidad,
        precio: localPrecio,
        descuento_porcentaje: localDescuento,
        subtotal: parseFloat(subtotalFinal.toFixed(2)),
        producto_nombre: localNombre.trim() || producto.producto_nombre // ✅ Incluir nombre editado
      };

      console.log('💾 Guardando:', productoActualizado.producto_nombre);
      await onGuardar(productoActualizado);
      console.log('✅ Guardado exitoso');

    } catch (error) {
      console.error('❌ Error guardando:', error);
      toast.error('Error al guardar cambios');
      setGuardando(false);
    }
  };

  const handleCerrarClick = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    if (guardando) {
      console.log('⚠️ No cerrar mientras guarda');
      return;
    }
    
    console.log('🚪 Cerrando modal');
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !guardando) {
      handleCerrarClick();
    }
  };

  // ✅ RENDER
  return (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div 
        className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 md:p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg sm:text-xl font-bold">🔧 Editar Producto</h2>
            <button 
              type="button"
              onClick={handleCerrarClick}
              disabled={guardando}
              className="text-gray-500 hover:text-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed text-xl p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-4">
            {/* Información básica */}
            <div>
              <label className="block mb-1 font-medium text-sm">Código:</label>
              <input 
                type="text"
                className="border p-2 w-full rounded bg-gray-100 text-sm"
                value={producto.producto_id || ''}
                disabled
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-sm">Nombre:</label>
              <div className="flex items-center gap-2">
                <input 
                  type="text"
                  className={`border p-2 flex-1 rounded text-sm ${
                    editandoNombre 
                      ? 'bg-white border-blue-500 focus:ring-2 focus:ring-blue-500' 
                      : 'bg-gray-100'
                  }`}
                  value={localNombre}
                  onChange={(e) => setLocalNombre(e.target.value)}
                  onBlur={editandoNombre ? handleGuardarNombre : undefined}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && editandoNombre) {
                      handleGuardarNombre();
                    } else if (e.key === 'Escape' && editandoNombre) {
                      handleCancelarEdicionNombre();
                    }
                  }}
                  disabled={!editandoNombre || guardando}
                  readOnly={!editandoNombre}
                />
                {!editandoNombre && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleEditarNombre();
                    }}
                    disabled={guardando}
                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 border border-blue-300"
                    title="Editar nombre"
                  >
                    <span className="text-lg" role="img" aria-label="editar">✏️</span>
                  </button>
                )}
                {editandoNombre && (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleGuardarNombre();
                      }}
                      disabled={guardando || !localNombre.trim()}
                      className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 border border-green-300"
                      title="Guardar nombre"
                    >
                      <span className="text-lg" role="img" aria-label="guardar">✓</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleCancelarEdicionNombre();
                      }}
                      disabled={guardando}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 border border-red-300"
                      title="Cancelar edición"
                    >
                      <span className="text-lg" role="img" aria-label="cancelar">✕</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <label className="block mb-1 font-medium text-sm">Unidad de Medida:</label>
              <input 
                type="text"
                className="border p-2 w-full rounded bg-gray-100 text-sm"
                value={producto.producto_um || ''}
                disabled
              />
            </div>

            {/* Stock */}
            <div className="bg-blue-50 border border-blue-200 p-3 rounded">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Stock Disponible:</span>
                <span className={`font-bold ${stockDisponible > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stockDisponible}
                </span>
              </div>
            </div>
            
            {/* Precio */}
            {esGerente ? (
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                <label className="block mb-1 font-medium text-sm text-yellow-800">
                  💰 Precio Unitario ($):
                </label>
                <div className="flex items-center">
                  <span className="mr-1 text-yellow-600">$</span>
                  <input 
                    type="number"
                    disabled={guardando}
                    className="border border-yellow-300 p-2 w-full rounded text-sm focus:ring-2 focus:ring-yellow-500 disabled:bg-gray-100"
                    value={localPrecio}
                    onChange={handlePrecioChange}
                    min="0"
                    step="0.01"
                  />
                </div>
                <p className="text-xs text-yellow-600 mt-1">
                  ⚠️ Precio editable para gerentes
                </p>
              </div>
            ) : (
              <div>
                <label className="block mb-1 font-medium text-sm">Precio Unitario ($):</label>
                <div className="flex items-center">
                  <span className="mr-1 text-gray-600">$</span>
                  <input 
                    type="text"
                    className="border p-2 w-full rounded bg-gray-100 text-sm"
                    value={localPrecio.toFixed(2)}
                    disabled
                  />
                </div>
              </div>
            )}
            
            {/* Cantidad */}
            <div>
              <label className="block mb-1 font-medium text-sm">Cantidad:</label>
              <div className="flex items-center space-x-2">
                <button 
                  type="button"
                  disabled={localCantidad <= 0.5 || guardando} // ← CAMBIAR A 0.5
                  className="bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed text-black w-8 h-8 rounded flex items-center justify-center transition-colors"
                  onClick={() => handleCantidadBoton(-1)}
                >
                  -
                </button>
                <input 
                  type="number"
                  disabled={guardando}
                  className={`border p-2 w-20 rounded text-sm text-center disabled:bg-gray-100 ${
                    !stockSuficiente ? 'border-red-500 bg-red-50' : ''
                  }`}
                  value={localCantidad}
                  onChange={handleCantidadInput}
                  min="0.5" // ← CAMBIAR A 0.5
                  step="0.5" // ← AGREGAR step
                  max={stockDisponible}
                />
                <button 
                  type="button"
                  disabled={localCantidad >= stockDisponible || guardando}
                  className="bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed text-black w-8 h-8 rounded flex items-center justify-center transition-colors"
                  onClick={() => handleCantidadBoton(1)}
                >
                  +
                </button>
              </div>
              
              {!stockSuficiente && (
                <p className="text-red-600 text-xs mt-1">
                  ❌ Cantidad excede el stock disponible
                </p>
              )}
            </div>

            {/* Descuento */}
            {esGerente && (
              <div className="bg-orange-50 border border-orange-200 p-3 rounded">
                <label className="block mb-1 font-medium text-sm text-orange-800">
                  🏷️ Descuento (%):
                </label>
                <div className="flex items-center space-x-2">
                  <input 
                    type="number"
                    disabled={guardando}
                    className="border border-orange-300 p-2 w-20 rounded text-sm text-center focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100"
                    value={localDescuento}
                    onChange={handleDescuentoChange}
                    min="0"
                    max="100"
                    step="0.1"
                  />
                  <span className="text-orange-600">%</span>
                  <div className="flex-1 text-sm text-orange-700">
                    Descuento: <span className="font-bold">${montoDescuento.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Resumen */}
            <div className="bg-gray-50 border border-gray-200 p-3 rounded">
              <h4 className="font-medium text-sm mb-2 text-gray-800">📊 Resumen:</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal base:</span>
                  <span>${subtotalBase.toFixed(2)}</span>
                </div>
                {localDescuento > 0 && (
                  <div className="flex justify-between text-orange-600">
                    <span>Descuento ({localDescuento}%):</span>
                    <span>-${montoDescuento.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-green-600 border-t pt-1">
                  <span>Subtotal final:</span>
                  <span>${subtotalFinal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Loading */}
            {guardando && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  <span className="font-medium">Guardando cambios...</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Botones */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 mt-8">
            <button 
              type="button"
              onClick={handleGuardarClick}
              disabled={botonesDeshabilitados}
              className={`px-6 py-3 rounded-lg text-sm font-bold transition-colors w-full sm:w-auto min-w-[160px] flex items-center justify-center gap-2 ${
                botonesDeshabilitados
                  ? 'bg-gray-400 cursor-not-allowed text-gray-700'
                  : 'bg-green-600 hover:bg-green-700 text-white shadow-lg'
              }`}
            >
              {guardando && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              
              {guardando ? 'Guardando...' :
               !stockSuficiente ? '❌ Stock Insuficiente' : 
               localPrecio <= 0 ? '❌ Precio Inválido' : 
               '✅ GUARDAR CAMBIOS'}
            </button>

            <button 
              type="button"
              onClick={handleCerrarClick}
              disabled={guardando}
              className={`px-6 py-3 rounded-lg text-sm font-bold transition-colors w-full sm:w-auto min-w-[160px] flex items-center justify-center gap-2 ${
                guardando
                  ? 'bg-gray-400 cursor-not-allowed text-gray-700'
                  : 'bg-red-600 hover:bg-red-700 text-white shadow-lg'
              }`}
            >
              ❌ CANCELAR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ModalEliminarProductoPedido({ 
  producto, 
  onClose, 
  onConfirmar 
}) {
  const [eliminandoProducto, setEliminandoProducto] = useState(false); // ✅ NUEVO ESTADO PARA LOADING
  
  if (!producto) return null;

  const handleConfirmar = async () => {
    // ✅ ACTIVAR ESTADO DE LOADING
    setEliminandoProducto(true);
    
    try {
      await onConfirmar();
    } catch (error) {
      console.error('Error eliminando producto:', error);
      toast.error('Error al eliminar producto');
    } finally {
      // ✅ DESACTIVAR ESTADO DE LOADING
      setEliminandoProducto(false);
    }
  };

  const handleClose = () => {
    // ✅ NO PERMITIR CERRAR SI ESTÁ PROCESANDO
    if (eliminandoProducto) return;
    
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-4 md:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">⚠️ Confirmar Eliminación</h2>
            <button 
              type="button"
              onClick={handleClose}
              disabled={eliminandoProducto} // ✅ DESHABILITAR DURANTE PROCESAMIENTO
              className="text-gray-500 hover:text-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed text-xl p-1 rounded-full hover:bg-gray-100 transition-colors"
              title={eliminandoProducto ? "Procesando..." : "Cerrar"}
            >
              ✕
            </button>
          </div>
          
          <p className="text-center my-4">
            ¿Estás seguro de que deseas eliminar <strong>{producto.cantidad}</strong> unidades de <strong>{producto.producto_nombre}</strong>?
          </p>

          
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
            <button 
              onClick={handleConfirmar}
              disabled={eliminandoProducto} // ✅ DESHABILITAR DURANTE PROCESAMIENTO
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded transition-colors flex items-center justify-center gap-2"
            >
              {/* ✅ SPINNER EN EL BOTÓN CUANDO ESTÁ PROCESANDO */}
              {eliminandoProducto && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              {eliminandoProducto ? 'Eliminando...' : 'Sí, eliminar'}
            </button>
            <button 
              onClick={handleClose}
              disabled={eliminandoProducto} // ✅ DESHABILITAR DURANTE PROCESAMIENTO
              className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded transition-colors"
            >
              {eliminandoProducto ? 'Procesando...' : 'No, cancelar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TablaProductosEscritorio({ productos, onEditarProducto, onEliminarProducto, canEdit }) {
  return (
    <div className="hidden lg:block overflow-x-auto bg-white rounded shadow">
      <table className="w-full text-sm">
        <thead className="bg-gray-200">
          <tr>
            <th className="p-2 text-left">Código</th>
            <th className="p-2 text-left">Nombre</th>
            <th className="p-2 text-center">UM</th>
            <th className="p-2 text-center">Cant.</th>
            <th className="p-2 text-right">Precio Unit.</th>
            <th className="p-2 text-center">Desc. %</th> {/* 🆕 COLUMNA DESCUENTO */}
            <th className="p-2 text-right">IVA ($)</th>
            <th className="p-2 text-right">Subtotal</th>
            <th className="p-2 text-center">Acción</th>
          </tr>
        </thead>
        <tbody>
          {productos.map((producto) => {
            const precio = Number(producto.precio) || 0;
            const cantidad = Number(producto.cantidad) || 0;
            const ivaValue = Number(producto.iva) || 0;
            const subtotalSinIva = Number(producto.subtotal) || (cantidad * precio);
            const descuentoPorcentaje = Number(producto.descuento_porcentaje) || 0; // ✅ DESCUENTO
            
            // 🆕 CALCULAR SUBTOTAL BASE PARA MOSTRAR DESCUENTO
            const subtotalBase = cantidad * precio;
            const montoDescuento = (subtotalBase * descuentoPorcentaje) / 100;
            
            return (
              <tr key={producto.id}
                  className={`hover:bg-gray-100 ${canEdit ? 'cursor-pointer' : 'cursor-not-allowed'} border-b`}
                  onDoubleClick={canEdit ? () => onEditarProducto(producto) : undefined}> 
                <td className="p-2 font-mono text-xs">{producto.producto_id}</td>
                <td className="p-2 font-medium">{producto.producto_nombre}</td>
                <td className="p-2 text-center">{producto.producto_um}</td>
                <td className="p-2 text-center font-semibold">{cantidad}</td>
                <td className="p-2 text-right">
                  <div>${precio.toFixed(2)}</div>
                </td>
                <td className="p-2 text-center"> {/* ✅ COLUMNA DESCUENTO CORREGIDA */}
                  {descuentoPorcentaje > 0 ? (
                    <div>
                      <div className="text-orange-600 font-bold">{descuentoPorcentaje}%</div>
                      <div className="text-xs text-red-600">-${montoDescuento.toFixed(2)}</div>
                    </div>
                  ) : (
                    <span className="text-gray-400">0%</span>
                  )}
                </td>
                <td className="p-2 text-right">${ivaValue.toFixed(2)}</td>
                <td className="p-2 text-right">
                  <div className="font-semibold text-green-600">${subtotalSinIva.toFixed(2)}</div>
                  {/* 🆕 MOSTRAR QUE INCLUYE DESCUENTO */}
                  {descuentoPorcentaje > 0 && (
                    <div className="text-xs text-orange-600">Con desc.</div>
                  )}
                </td>
                <td className="p-2 text-center">
                  {canEdit && ( 
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEliminarProducto(producto);
                      }}
                      className="bg-red-500 text-white p-1 rounded hover:bg-red-600 transition-colors"
                      title="Eliminar producto"
                    >
                      <MdDeleteForever size={16} />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function TarjetasProductosMovil({ productos, onEditarProducto, onEliminarProducto, canEdit }) {
  return (
    <div className="lg:hidden space-y-3">
      {productos.map((producto) => {
        const precio = Number(producto.precio) || 0;
        const cantidad = Number(producto.cantidad) || 0;
        const ivaValue = Number(producto.iva) || 0;
        const subtotalSinIva = Number(producto.subtotal) || (cantidad * precio);
        const descuentoPorcentaje = Number(producto.descuento_porcentaje) || 0; // ✅ DESCUENTO
        
        // 🆕 CALCULAR INFORMACIÓN DEL DESCUENTO
        const subtotalBase = cantidad * precio;
        const montoDescuento = (subtotalBase * descuentoPorcentaje) / 100;
        
        return (
          <div key={producto.id} className="bg-white p-3 rounded shadow border">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800 text-sm">{producto.producto_nombre}</h4>
                <p className="text-xs text-gray-500">Código: {producto.producto_id}</p>
                {/* 🆕 MOSTRAR DESCUENTO EN MÓVIL */}
                {descuentoPorcentaje > 0 && (
                  <div className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded mt-1 inline-block">
                    🏷️ {descuentoPorcentaje}% descuento (-${montoDescuento.toFixed(2)})
                  </div>
                )}
              </div>
              {canEdit && (
                <button
                  className="bg-red-500 hover:bg-red-700 text-white px-2 py-1 rounded ml-2 transition-colors text-xs"
                  onClick={() => onEliminarProducto(producto)}
                  title="Eliminar producto"
                >
                  ✕
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-600 block">UM:</span>
                <span className="font-medium">{producto.producto_um}</span>
              </div>
              <div>
                <span className="text-gray-600 block">Cantidad:</span>
                <span className="font-semibold text-blue-600">{cantidad}</span>
              </div>
              <div>
                <span className="text-gray-600 block">Precio:</span>
                <div>
                  <span className="font-medium">${precio.toFixed(2)}</span>
                  {/* 🆕 MOSTRAR PRECIO BASE SI HAY DESCUENTO */}
                  {descuentoPorcentaje > 0 && (
                    <div className="text-xs text-gray-500">
                      Base: ${subtotalBase.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <span className="text-gray-600 block">IVA:</span>
                <span className="font-medium">${ivaValue.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-xs">Subtotal:</span>
                <div className="text-right">
                  <span className="font-semibold text-green-600">${subtotalSinIva.toFixed(2)}</span>
                  {/* 🆕 INDICAR QUE INCLUYE DESCUENTO */}
                  {descuentoPorcentaje > 0 && (
                    <div className="text-xs text-orange-600">Con descuento</div>
                  )}
                </div>
              </div>
            </div>
            
            {canEdit && (
              <button
                onClick={() => onEditarProducto(producto)}
                className="mt-2 w-full bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded text-xs transition-colors"
              >
                {descuentoPorcentaje > 0 ? '✏️ Editar (con desc.)' : 'Editar'}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}


export function TablaProductos({ productos, onEditarProducto, onEliminarProducto, loading, canEdit }) {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2">Cargando productos...</span>
      </div>
    );
  }

  if (productos.length === 0) {
    return (
      <div className="bg-white rounded shadow p-8 text-center text-gray-500">
        <div className="text-4xl mb-2">📦</div>
        <div className="font-medium">No hay productos en este pedido</div>
      </div>
    );
  }

  return (
    <>
      <TablaProductosEscritorio
        productos={productos}
        onEditarProducto={onEditarProducto}
        onEliminarProducto={onEliminarProducto}
        canEdit={canEdit}
      />
      <TarjetasProductosMovil
        productos={productos}
        onEditarProducto={onEditarProducto}
        onEliminarProducto={onEliminarProducto}
        canEdit={canEdit}
      />
    </>
  );
}


export function ResumenTotales({ productos, pedido }) {
  const subtotalNeto = productos.reduce((acc, prod) => {
    return acc + (Number(prod.subtotal) || 0);
  }, 0);

  const ivaTotal = productos.reduce((acc, prod) => {
    return acc + (Number(prod.iva) || 0);
  }, 0);

  // 🆕 CALCULAR DESCUENTOS TOTALES
  const totalDescuentos = productos.reduce((acc, prod) => {
    const precio = Number(prod.precio) || 0;
    const cantidad = Number(prod.cantidad) || 0;
    const descuento = Number(prod.descuento_porcentaje) || 0;
    const subtotalBase = precio * cantidad;
    const montoDescuento = (subtotalBase * descuento) / 100;
    return acc + montoDescuento;
  }, 0);
  
  // ✅ Obtener monto exento del pedido si está disponible, o calcularlo si el cliente es exento
  const esClienteExento = pedido?.cliente_condicion?.toUpperCase() === 'EXENTO';
  let montoExento = pedido?.exento ? Number(pedido.exento) : 0;
  
  // Si el cliente es exento pero no hay monto exento guardado, calcularlo
  if (esClienteExento && montoExento === 0 && productos.length > 0) {
    montoExento = productos.reduce((acc, prod) => {
      const subtotal = Number(prod.subtotal) || 0;
      // Intentar obtener el porcentaje de IVA del producto, o usar 21% por defecto
      const porcentajeIva = Number(prod.porcentaje_iva) || 21;
      const ivaQueDeberiaCobrarse = parseFloat((subtotal * (porcentajeIva / 100)).toFixed(2));
      return acc + ivaQueDeberiaCobrarse;
    }, 0);
  }

  const totalFinal = subtotalNeto + ivaTotal;

  // 🆕 CALCULAR TOTAL SIN DESCUENTOS PARA COMPARACIÓN
  const totalSinDescuentos = productos.reduce((acc, prod) => {
    const precio = Number(prod.precio) || 0;
    const cantidad = Number(prod.cantidad) || 0;
    const subtotalBase = precio * cantidad;
    const ivaBase = subtotalBase * 0.21; // Asumiendo 21% IVA
    return acc + subtotalBase + ivaBase;
  }, 0);

  if (productos.length === 0) return null;

  return (
    <div className="mt-4 bg-gray-50 rounded-lg p-3 border-2 border-gray-200">
      <div className="space-y-2">
        {/* 🆕 MOSTRAR DESCUENTOS SI LOS HAY */}
        {totalDescuentos > 0 && (
          <>
            <div className="flex justify-between items-center py-1 border-b border-gray-300 text-sm">
              <span className="text-gray-700 font-medium">TOTAL ORIGINAL:</span>
              <span className="font-semibold text-gray-600">${totalSinDescuentos.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-gray-300 text-sm">
              <span className="text-orange-700 font-medium">DESCUENTOS APLICADOS:</span>
              <span className="font-semibold text-orange-600">-${totalDescuentos.toFixed(2)}</span>
            </div>
          </>
        )}
        
        <div className="flex justify-between items-center py-1 border-b border-gray-300 text-sm">
          <span className="text-gray-700 font-medium">SUBTOTAL (sin IVA):</span>
          <span className="font-semibold text-gray-800">${subtotalNeto.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between items-center py-1 border-b border-gray-300 text-sm">
          <span className="text-gray-700 font-medium">IVA TOTAL:</span>
          <span className="font-semibold text-red-600">${ivaTotal.toFixed(2)}</span>
        </div>
        
        {/* ✅ Mostrar monto exento si el cliente es exento */}
        {esClienteExento && (
          <div className="flex justify-between items-center py-1 border-b border-gray-300 text-sm">
            <span className="text-gray-700 font-medium italic">MONTO EXENTO (IVA no cobrado):</span>
            <span className="font-semibold text-orange-600">${montoExento.toFixed(2)}</span>
          </div>
        )}
        
        <div className="flex justify-between items-center py-2 bg-yellow-300 rounded-lg px-3 border-2 border-yellow-400">
          <span className="text-black font-bold">TOTAL FINAL:</span>
          <span className="text-black text-lg font-bold">${totalFinal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}



export function ModalDetallePedido({
  pedido,
  productos,
  loading,
  onClose,
  onAgregarProducto,
  onEditarProducto,
  onEliminarProducto,
  onCambiarEstado,
  onGenerarPDF,
  onActualizarObservaciones,
  onActualizarClientePedido,
  generandoPDF,
  mostrarModalFacturacion,
  setMostrarModalFacturacion,
  isPedidoFacturado,
  isPedidoAnulado,
  mostrarModalPDF,
  pdfURL,
  nombreArchivo,
  tituloModal,
  subtituloModal,
  onDescargarPDF,
  onCompartirPDF,
  onCerrarModalPDF,
  cuentas = [],           // ✅ AGREGAR PROP
  cargandoCuentas = false // ✅ AGREGAR PROP
}) {
  const [clienteExpandido, setClienteExpandido] = useState(false);
  const [productosExpandidos, setProductosExpandidos] = useState(false);
  
  const { user } = useAuth();
  const { facturarPedido } = useFacturacion(); // ✅ USAR HOOK DE FACTURACIÓN

  const formatearFecha = (fecha) => {
    if (!fecha) return 'Fecha no disponible';
    return new Date(fecha).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  if (!pedido) return null;
  
  const esGerente = user?.rol === 'GERENTE';
  const canEdit = !isPedidoFacturado && !isPedidoAnulado;

  const toggleClienteExpansion = () => {
    setClienteExpandido(!clienteExpandido);
  };

  const handleFacturar = () => {
    setMostrarModalFacturacion(true);
  };

  // ✅ FUNCIÓN PARA CONFIRMAR FACTURACIÓN
  const handleConfirmarFacturacion = async (datosFacturacion) => {
  try {
    // ✅ AGREGAR pedidoId al objeto antes de enviar
    const datosCompletos = {
      ...datosFacturacion,
      pedidoId: pedido.id  // ✅ Usar pedido en lugar de selectedPedido
    };
    
    const resultado = await facturarPedido(datosCompletos); // ✅ Enviar objeto completo
    
    if (resultado.success) {
      await onCambiarEstado('Facturado');
      setMostrarModalFacturacion(false);
      toast.success(`Pedido #${pedido.id} facturado exitosamente!`);
    } else {
      toast.error(resultado.error || 'Error al facturar pedido');
    }
  } catch (error) {
    console.error('Error facturando:', error);
    toast.error('Error al procesar facturación');
  }
};

  const handleAbrirModalAgregar = () => {
    if (onAgregarProducto) {
      onAgregarProducto();
    }
  };

  const handleEditarProductoGerente = (producto) => {
    onEditarProducto(producto);
  };

  const handleEliminarProductoGerente = (producto) => {
    onEliminarProducto(producto);
  };

  return (
    <>
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-2 sm:p-4">
        <div className="bg-white rounded-lg w-full max-w-xs sm:max-w-2xl lg:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
          <div className="p-3 sm:p-4 lg:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">
                Pedido #{pedido.id}
              </h2>
              <button 
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-xl sm:text-2xl p-1"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <h4 className="text-sm sm:text-lg font-semibold text-gray-700">
                <strong>Fecha:</strong> {formatearFecha(pedido.fecha)}
              </h4>
            </div>
            
            {/* ✅ PASAR CUENTAS Y CARGANDO AL COMPONENTE */}
            <InformacionCliente
              pedido={pedido}
              expandido={clienteExpandido}
              onToggleExpansion={toggleClienteExpansion}
              mostrarModalFacturacion={mostrarModalFacturacion}
              setMostrarModalFacturacion={setMostrarModalFacturacion}
              productos={productos}
              handleConfirmarFacturacion={handleConfirmarFacturacion}
              cuentas={cuentas}                     // ✅ PASAR CUENTAS
              cargandoCuentas={cargandoCuentas}     // ✅ PASAR LOADING
              onActualizarClientePedido={onActualizarClientePedido} // ✅ PASAR HANDLER
              isPedidoAnulado={isPedidoAnulado}     // ✅ PASAR ESTADO ANULADO
              isPedidoFacturado={isPedidoFacturado} // ✅ PASAR ESTADO FACTURADO
            />

            <InformacionAdicional 
              pedido={pedido} 
              onActualizarObservaciones={onActualizarObservaciones}
              canEdit={canEdit}
            />

            {/* Resto del código igual... */}
            <div className="mb-4">
              <div 
                className="lg:hidden flex justify-between items-center bg-blue-50 p-3 rounded-lg cursor-pointer border-2 border-blue-200 mb-2"
                onClick={() => setProductosExpandidos(!productosExpandidos)}
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Productos del Pedido</h3>
                  <p className="text-sm text-gray-600">{productos.length} producto(s)</p>
                </div>
                <div className="text-blue-600">
                  {productosExpandidos ? <MdExpandLess size={28} /> : <MdExpandMore size={28} />}
                </div>
              </div>

              <h3 className="hidden lg:block text-xl font-semibold text-gray-800 mb-4">
                Productos del Pedido
              </h3>
              
              <div className={`${productosExpandidos ? 'block' : 'hidden'} lg:block`}>
                {canEdit && (
                  <button
                    onClick={handleAbrirModalAgregar}
                    className="mb-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center w-full sm:w-auto"
                  >
                    ➕ AGREGAR PRODUCTO
                  </button>
                )}
              </div>

              <div className={`lg:hidden transition-all duration-300 ease-in-out ${
                productosExpandidos ? 'opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
              }`}>
                <div className={`${
                  productosExpandidos ? 'max-h-[50vh] overflow-y-auto' : 'max-h-0'
                } border rounded-lg mb-3`}>
                  <TablaProductos
                    productos={productos}
                    onEditarProducto={handleEditarProductoGerente}
                    onEliminarProducto={handleEliminarProductoGerente}
                    loading={loading}
                    canEdit={canEdit}
                  />
                </div>
                {productosExpandidos && <ResumenTotales productos={productos} pedido={pedido} />}
              </div>

              <div className="hidden lg:block">
                <TablaProductos
                  productos={productos}
                  onEditarProducto={handleEditarProductoGerente}
                  onEliminarProducto={handleEliminarProductoGerente}
                  loading={loading}
                  canEdit={canEdit}
                />
                <ResumenTotales productos={productos} pedido={pedido} />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-3">
                {esGerente && !isPedidoFacturado && (
                  <button 
                    onClick={handleFacturar}
                    className="bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base font-semibold px-4 py-3 rounded-lg transition-colors flex items-center justify-center flex-1"
                  >
                    ✅ FACTURAR
                  </button>
                )}
                
                <BotonGenerarPDFUniversal 
                  onGenerar={onGenerarPDF}
                  loading={generandoPDF}
                  texto="🖨️ IMPRIMIR"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base font-semibold px-4 py-3 rounded-lg transition-colors flex items-center justify-center flex-1"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {esGerente && !isPedidoFacturado && (
                  <button 
                    onClick={() => onCambiarEstado('Anulado')}
                    className="bg-red-600 hover:bg-red-700 text-white text-sm sm:text-base font-semibold px-4 py-3 rounded-lg transition-colors flex items-center justify-center flex-1"
                  >
                    🚫 ANULAR
                  </button>
                )}
                
                <button 
                  onClick={onClose}
                  className="bg-gray-600 hover:bg-gray-700 text-white text-sm sm:text-base font-semibold px-4 py-3 rounded-lg transition-colors flex items-center justify-center flex-1"
                >
                  CERRAR
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ModalPDFUniversal
        mostrar={mostrarModalPDF}
        pdfURL={pdfURL}
        nombreArchivo={nombreArchivo}
        titulo={tituloModal}
        subtitulo={subtituloModal}
        onDescargar={onDescargarPDF}
        onCompartir={onCompartirPDF}
        onCerrar={onCerrarModalPDF}
        zIndex={70}
      />
    </>
  );
}