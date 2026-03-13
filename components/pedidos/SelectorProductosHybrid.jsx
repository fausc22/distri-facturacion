import { useEffect } from 'react';
import { MdSearch } from "react-icons/md";
import { toast } from 'react-hot-toast';
import { usePedidosContext } from '../../context/PedidosContext';
import { useProductoSearchHybrid } from '../../hooks/useProductSearchHybrid';


const formatearStock = (stock) => {
  const stockNum = parseFloat(stock);
  // Si es entero, mostrar sin decimales. Si es decimal, mostrar con decimales
  return stockNum % 1 === 0 ? stockNum.toString() : stockNum.toFixed(1);
};

const formatearMoneda = (monto) => `$${Number(monto || 0).toFixed(2)}`;

const obtenerPorcentajeIva = (producto) => {
  const iva = Number(producto?.iva ?? producto?.porcentaje_iva ?? 21);
  return Number.isFinite(iva) && iva >= 0 ? iva : 21;
};

const calcularMontoConIva = (montoBase, porcentajeIva) =>
  Number(montoBase || 0) * (1 + porcentajeIva / 100);


function ControlCantidad({ cantidad, onCantidadChange, stockDisponible, className = "" }) {
  const handleCantidadChange = (nuevaCantidad) => {
    let cantidadNum = parseFloat(nuevaCantidad);
    if (isNaN(cantidadNum)) cantidadNum = 0.5;
    
    // Redondear a medios más cercano
    cantidadNum = Math.round(cantidadNum * 2) / 2;
    
    // ✅ CORREGIR LÍMITES - PERMITIR 0.5
    const cantidadValida = Math.min(Math.max(0.5, cantidadNum), stockDisponible);
    
    onCantidadChange(cantidadValida);
  };

  const incrementar = () => {
    const nuevaCantidad = cantidad + 0.5;
    if (nuevaCantidad <= stockDisponible) {
      handleCantidadChange(nuevaCantidad);
    }
  };

  const decrementar = () => {
    // ✅ PERMITIR LLEGAR A 0.5
    const nuevaCantidad = Math.max(0.5, cantidad - 0.5);
    handleCantidadChange(nuevaCantidad);
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <button 
        className={`w-11 h-11 rounded flex items-center justify-center font-bold ${
          cantidad <= 0.5 
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
            : 'bg-gray-300 hover:bg-gray-400 text-black'
        }`}
        onClick={decrementar}
        disabled={cantidad <= 0.5} // ✅ DESHABILITAR EN 0.5
      >
        -
      </button>
      <input
        type="number"
        value={cantidad}
        onChange={(e) => handleCantidadChange(e.target.value)}
        min="0.5"
        step="0.5"
        max={stockDisponible}
        inputMode="decimal"
        className="w-24 min-h-[44px] p-2 rounded text-black border border-gray-300 text-center text-base"
        onBlur={(e) => {
          // ✅ VALIDAR AL PERDER FOCO
          const valor = parseFloat(e.target.value);
          if (isNaN(valor) || valor < 0.5) {
            handleCantidadChange(0.5);
          }
        }}
      />
      <button 
        className={`w-11 h-11 rounded flex items-center justify-center font-bold ${
          cantidad >= stockDisponible
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-gray-300 hover:bg-gray-400 text-black'
        }`}
        onClick={incrementar}
        disabled={cantidad >= stockDisponible}
      >
        +
      </button>
    </div>
  );
}

function DetallesProducto({
  producto,
  cantidad,
  subtotal,
  onCantidadChange,
  onAgregar,
  isPWA,
  isOnline,
  mostrarPreciosConIva = true
}) {
  if (!producto) return null;

  const stockInsuficiente = cantidad > producto.stock_actual;
  const porcentajeIva = obtenerPorcentajeIva(producto);
  const precioNeto = Number(producto.precio) || 0;
  const precioFinal = calcularMontoConIva(precioNeto, porcentajeIva);
  const subtotalNeto = Number(subtotal) || 0;
  const subtotalFinal = calcularMontoConIva(subtotalNeto, porcentajeIva);

  return (
    <div className="mt-4">
      <div className={`mb-2 text-xl font-bold ${producto.stock_actual > 0 ? 'text-green-700' : 'text-red-600'}`}>
        STOCK DISPONIBLE: {formatearStock(producto.stock_actual)} {/* ← USAR LA FUNCIÓN */}
        {isPWA && (
          <span className={`ml-2 text-xs px-2 py-1 rounded ${
            isOnline ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
          }`}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        )}
      </div>

      <div className="mb-3 rounded-md border border-gray-200 bg-gray-50 p-3 text-black">
        <p className="text-sm text-gray-600">Precio unitario sin IVA</p>
        <p className="text-base font-semibold">{formatearMoneda(precioNeto)}</p>
        {mostrarPreciosConIva && (
          <>
            <p className="mt-2 text-sm text-gray-600">
              Precio final con IVA ({porcentajeIva}%)
            </p>
            <p className="text-lg font-bold text-green-700">{formatearMoneda(precioFinal)}</p>
          </>
        )}
      </div>
      
      <div className="flex items-center gap-4 mb-4">
        <label htmlFor="cantidad" className="text-black">Cantidad:</label>
        <ControlCantidad 
          cantidad={cantidad}
          onCantidadChange={onCantidadChange}
          stockDisponible={parseFloat(producto.stock_actual)}
        />
        <span className="text-sm text-gray-600">
          (mínimo 0.5)
        </span>
      </div>

      {stockInsuficiente && (
        <div className="text-red-600 font-semibold mb-2">
          ⚠️ Stock insuficiente. Máximo disponible: {formatearStock(producto.stock_actual)} {/* ← USAR LA FUNCIÓN */}
        </div>
      )}

      <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-black">
        <p className="text-sm text-gray-600">Subtotal sin IVA</p>
        <p className="font-semibold">{formatearMoneda(subtotalNeto)}</p>
        {mostrarPreciosConIva && (
          <>
            <p className="mt-1 text-sm text-gray-600">Subtotal final con IVA</p>
            <p className="text-lg font-bold text-green-700">{formatearMoneda(subtotalFinal)}</p>
          </>
        )}
      </div>

      <button
        onClick={onAgregar}
        disabled={stockInsuficiente || producto.stock_actual <= 0}
        className={`px-6 py-2 rounded font-semibold ${
          stockInsuficiente || producto.stock_actual <= 0
            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-800 text-white'
        }`}
      >
        {producto.stock_actual <= 0 ? 'Sin Stock' : `Agregar ${formatearStock(cantidad)} unidades`} {/* ← USAR LA FUNCIÓN */}
      </button>
    </div>
  );
}

function ModalProductos({ 
  resultados, 
  productoSeleccionado, 
  cantidad,
  subtotal,
  onSeleccionar, 
  onCantidadChange,
  onAgregar,
  onCerrar, 
  loading,
  isPWA,
  isOnline,
  mostrarPreciosConIva = true
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 sm:p-4">
      <div className="flex h-[100dvh] w-screen flex-col bg-white p-4 sm:h-auto sm:max-h-[90vh] sm:w-full sm:max-w-md sm:rounded-lg">
        <div className="mb-4 flex shrink-0 items-center justify-between">
          <h3 className="text-lg font-semibold text-black">Seleccionar Producto</h3>
          {/* ✅ INDICADOR DE MODO */}
          {isPWA && (
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-orange-500'}`}></div>
              <span className={isOnline ? 'text-green-600' : 'text-orange-600'}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1 sm:max-h-[70vh]">
          <ul>
            {loading ? (
              <li className="py-4 text-center text-gray-500">
                <div className="flex items-center justify-center">
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-blue-600"></div>
                  Buscando{isPWA && !isOnline ? ' offline' : ''}...
                </div>
              </li>
            ) : resultados.length > 0 ? (
              resultados.map((producto, idx) => {
                const isSelected = productoSeleccionado?.id === producto.id;
                return (
                  <li key={producto.id ?? idx} className="border-b">
                    <div
                      className={`cursor-pointer p-2 text-black transition-colors ${
                        producto.stock_actual > 0 
                          ? 'hover:bg-gray-100' 
                          : 'bg-red-50 text-red-600'
                      } ${isSelected ? 'bg-blue-50/60' : ''}`}
                      onClick={() => onSeleccionar(producto)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium leading-snug text-black sm:text-base whitespace-normal break-words">
                            {producto.nombre}
                          </p>
                          <p className="text-sm text-gray-700">
                            Neto: {formatearMoneda(producto.precio)}
                          </p>
                          {mostrarPreciosConIva && (
                            <p className="text-sm font-semibold text-green-700">
                              Final c/IVA ({obtenerPorcentajeIva(producto)}%):{" "}
                              {formatearMoneda(calcularMontoConIva(producto.precio, obtenerPorcentajeIva(producto)))}
                            </p>
                          )}
                        </div>
                        <div className="min-w-[88px] shrink-0 text-right">
                          <span className={`text-sm ${
                            producto.stock_actual > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            Stock: {formatearStock(producto.stock_actual)} 
                          </span>
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="border-t bg-white p-3">
                        <DetallesProducto
                          producto={productoSeleccionado}
                          cantidad={cantidad}
                          subtotal={subtotal}
                          onCantidadChange={onCantidadChange}
                          onAgregar={onAgregar}
                          isPWA={isPWA}
                          isOnline={isOnline}
                          mostrarPreciosConIva={mostrarPreciosConIva}
                        />
                      </div>
                    )}
                  </li>
                );
              })
            ) : (
              <li className="py-4 text-center text-gray-500">
                {isPWA && !isOnline 
                  ? "No se encontraron productos en datos offline." 
                  : "No se encontraron resultados."
                }
              </li>
            )}
          </ul>

        </div>

        <button
          onClick={onCerrar}
          className="mt-4 shrink-0 bg-red-500 px-4 py-2 text-white transition-colors hover:bg-red-600 sm:rounded"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

export default function ProductoSelectorHybrid({ mostrarPreciosConIva = true }) {
  const { addProducto } = usePedidosContext();
  const {
    busqueda,
    setBusqueda,
    resultados,
    productoSeleccionado,
    cantidad,
    subtotal,
    loading,
    mostrarModal,
    setMostrarModal,
    buscarProducto,
    seleccionarProducto,
    actualizarCantidad,
    limpiarSeleccion,
    isPWA,
    isOnline
  } = useProductoSearchHybrid();

  const handleAgregarProducto = () => {
    if (!productoSeleccionado || cantidad <= 0) return;
    
    if (cantidad > productoSeleccionado.stock_actual) {
      toast.error(`NO HAY STOCK DISPONIBLE PARA ${productoSeleccionado.nombre.toUpperCase()}.`);
      return;
    }
    
    if (productoSeleccionado.stock_actual === 0) {
      toast.error(`NO HAY STOCK DISPONIBLE PARA ${productoSeleccionado.nombre.toUpperCase()}.`);
      return;
    }
    
    addProducto(productoSeleccionado, cantidad, subtotal);
    limpiarSeleccion();
    
    // ✅ MENSAJE DIFERENCIADO POR MODO
    if (isPWA && !isOnline) {
      toast.success(`📱 ${productoSeleccionado.nombre} agregado (offline)`);
    } else {
      toast.success(`${productoSeleccionado.nombre} agregado al pedido`);
    }
  };

  // ✅ FUNCIÓN PARA OBTENER PLACEHOLDER DINÁMICO
  const getPlaceholder = () => {
    if (!isPWA) return "Buscar producto";
    return isOnline ? "Buscar producto (online)" : "Buscar producto (offline)";
  };

  // ✅ FUNCIÓN PARA OBTENER CLASE DEL CONTENEDOR
  const getContainerClass = () => {
    const baseClass = "bg-blue-500 p-6 rounded-lg flex-1 text-white";
    if (!isPWA) return baseClass;
    
    const borderClass = isOnline ? "border-l-4 border-green-400" : "border-l-4 border-orange-400";
    return `${baseClass} ${borderClass}`;
  };

  return (
    <div className={getContainerClass()}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Productos</h2>
        
        {/* ✅ INDICADOR DE ESTADO PARA PWA */}
        {isPWA && (
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-400' : 'bg-orange-400'}`}></div>
            <span className={`text-sm font-medium ${isOnline ? 'text-green-200' : 'text-orange-200'}`}>
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder={getPlaceholder()}
          className={`flex-1 p-2 min-h-[44px] rounded text-black text-base ${
            isPWA && !isOnline ? 'bg-orange-50 border-orange-300' : ''
          }`}
          autoCapitalize="none"
          autoCorrect="off"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <button
          onClick={buscarProducto}
          disabled={loading}
          className={`p-2 min-h-[44px] min-w-[44px] rounded transition ${
            loading
              ? 'bg-gray-400 cursor-not-allowed text-gray-600'
              : isOnline 
                ? 'bg-white text-blue-900 hover:bg-sky-300'
                : 'bg-orange-200 text-orange-800 hover:bg-orange-300'
          }`}
          title={
            isPWA 
              ? isOnline 
                ? "Buscar producto online" 
                : "Buscar producto en datos offline"
              : "Buscar producto"
          }
        >
          {loading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current"></div>
          ) : (
            <MdSearch size={24} />
          )}
        </button>
      </div>

      

      {mostrarModal && (
        <ModalProductos
          resultados={resultados}
          productoSeleccionado={productoSeleccionado}
          cantidad={cantidad}
          subtotal={subtotal}
          onSeleccionar={seleccionarProducto}
          onCantidadChange={actualizarCantidad}
          onAgregar={handleAgregarProducto}
          onCerrar={() => setMostrarModal(false)}
          loading={loading}
          isPWA={isPWA}
          isOnline={isOnline}
          mostrarPreciosConIva={mostrarPreciosConIva}
        />
      )}
    </div>
  );
}