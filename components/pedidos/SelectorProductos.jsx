import { useEffect, useState } from 'react';
import { MdSearch } from "react-icons/md";
import { toast } from 'react-hot-toast'; // Importar toast
import { useContextoCompartido } from '../../hooks/shared/useContextoCompartido';
import { useProductoSearch } from '../../hooks/useBusquedaProductos';
import { ModalAgregarFlete } from '../ventas/ModalAgregarFlete';
import { roundFacturacion } from '../../utils/rounding';

const formatearMoneda = (monto) => `$${Number(monto || 0).toFixed(2)}`;

const obtenerPorcentajeIva = (producto) => {
  const iva = Number(producto?.iva ?? producto?.porcentaje_iva ?? 21);
  return Number.isFinite(iva) && iva >= 0 ? iva : 21;
};

const calcularMontoConIva = (montoBase, porcentajeIva) =>
  roundFacturacion(Number(montoBase || 0) * (1 + porcentajeIva / 100));

function ControlCantidad({ cantidad, onCantidadChange, stockDisponible, className = "" }) {
  const formatearCantidad = (cantidad) => {
    const cantidadNum = parseFloat(cantidad);
    return cantidadNum % 1 === 0 ? cantidadNum.toString() : cantidadNum.toFixed(1);
  };

  const handleCantidadChange = (nuevaCantidad) => {
    let cantidadFloat = parseFloat(nuevaCantidad) || 0.5;
    
    // Redondear a medios más cercano
    cantidadFloat = Math.round(cantidadFloat * 2) / 2;
    
    // Aplicar límites
    const cantidadValida = Math.max(0.5, Math.min(stockDisponible, cantidadFloat));
    onCantidadChange(cantidadValida);
  };

  const incrementar = () => {
    const nuevaCantidad = cantidad + 0.5;
    if (nuevaCantidad <= stockDisponible) {
      handleCantidadChange(nuevaCantidad);
    }
  };

  const decrementar = () => {
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
        disabled={cantidad <= 0.5}
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
  mostrarPreciosConIva = true,
  mostrarBotonAgregar = true,
}) {
  if (!producto) return null;

  const formatearCantidad = (cantidad) => {
    const cantidadNum = parseFloat(cantidad);
    return cantidadNum % 1 === 0 ? cantidadNum.toString() : cantidadNum.toFixed(1);
  };

  const stockInsuficiente = cantidad > producto.stock_actual;
  const porcentajeIva = obtenerPorcentajeIva(producto);
  const precioNeto = Number(producto.precio) || 0;
  const precioFinal = calcularMontoConIva(precioNeto, porcentajeIva);
  const subtotalNeto = Number(subtotal) || 0;
  const subtotalFinal = calcularMontoConIva(subtotalNeto, porcentajeIva);

  return (
    <div className="mt-4">
      <div className={`mb-2 text-xl font-bold ${producto.stock_actual > 0 ? 'text-green-700' : 'text-red-600'}`}>
        STOCK DISPONIBLE: {formatearCantidad(producto.stock_actual)}
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
          stockDisponible={producto.stock_actual}
        />
        <span className="text-sm text-gray-600">
          (mínimo 0.5)
        </span>
      </div>

      {stockInsuficiente && (
        <div className="text-red-600 font-semibold mb-2">
          Stock insuficiente. Máximo disponible: {formatearCantidad(producto.stock_actual)}
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

      {mostrarBotonAgregar && (
        <button
          onClick={onAgregar}
          disabled={stockInsuficiente || producto.stock_actual === 0}
          className={`px-6 py-2 rounded font-semibold ${
            stockInsuficiente || producto.stock_actual === 0
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-800 text-white'
          }`}
        >
          {producto.stock_actual === 0 ? 'Sin Stock' : `Agregar ${formatearCantidad(cantidad)} unidades`}
        </button>
      )}
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
      <div className="flex h-[100dvh] w-screen flex-col bg-white sm:h-auto sm:max-h-[90vh] sm:w-full sm:max-w-md sm:rounded-lg">
        <div className="shrink-0 border-b px-4 py-3">
          <h3 className="text-lg font-semibold text-black">Seleccionar Producto</h3>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-1">
          <ul>
            {loading ? (
              <li className="py-4 text-center text-gray-500">Buscando...</li>
            ) : resultados.length > 0 ? (
              resultados.map((producto, idx) => {
                const isSelected = productoSeleccionado?.id === producto.id;
                return (
                  <li key={producto.id ?? idx} className="border-b last:border-0">
                    <div
                      className={`cursor-pointer p-3 text-black transition-all ${
                        producto.stock_actual > 0
                          ? 'hover:bg-gray-100'
                          : 'bg-red-50 text-red-600'
                      } ${isSelected ? 'bg-primary/10 ring-2 ring-inset ring-primary/40' : ''}`}
                      onClick={() => onSeleccionar(producto)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium sm:text-base">{producto.nombre}</p>
                          <p className="text-sm text-gray-700">Neto: {formatearMoneda(producto.precio)}</p>
                          {mostrarPreciosConIva && (
                            <p className="text-sm font-semibold text-green-700">
                              Final c/IVA ({obtenerPorcentajeIva(producto)}%):{' '}
                              {formatearMoneda(
                                calcularMontoConIva(producto.precio, obtenerPorcentajeIva(producto))
                              )}
                            </p>
                          )}
                        </div>
                        <span
                          className={`shrink-0 text-right text-sm ${
                            producto.stock_actual > 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          Stock: {producto.stock_actual}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })
            ) : (
              <li className="py-4 text-center text-gray-500">No se encontraron resultados.</li>
            )}
          </ul>
        </div>

        {productoSeleccionado && (
          <div className="animate-fade-in shrink-0 border-t bg-gray-50 p-3">
            <DetallesProducto
              producto={productoSeleccionado}
              cantidad={cantidad}
              subtotal={subtotal}
              onCantidadChange={onCantidadChange}
              onAgregar={onAgregar}
              mostrarPreciosConIva={mostrarPreciosConIva}
              mostrarBotonAgregar={false}
            />
          </div>
        )}

        <div
          className="shrink-0 space-y-2 border-t bg-white p-4"
          style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
        >
          {productoSeleccionado && (
            <button
              type="button"
              onClick={onAgregar}
              disabled={
                cantidad > productoSeleccionado.stock_actual ||
                productoSeleccionado.stock_actual <= 0
              }
              className={`flex min-h-[44px] w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white ${
                cantidad > productoSeleccionado.stock_actual ||
                productoSeleccionado.stock_actual <= 0
                  ? 'cursor-not-allowed bg-gray-400'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {productoSeleccionado.stock_actual <= 0
                ? 'Sin Stock'
                : `Agregar ${cantidad} unidades`}
            </button>
          )}
          <button
            type="button"
            onClick={onCerrar}
            className="flex min-h-[44px] w-full items-center justify-center rounded-lg bg-muted px-4 py-2.5 text-sm font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductoSelector({
  onAddProducto = null,
  mostrarPreciosConIva = true,
  mostrarBotonFletes = false,
  contextAdapter,
  containerClassName = 'bg-primary text-primary-foreground p-6 rounded-lg flex-1 min-w-0',
  title = 'Productos',
}) {
  const sharedContext = useContextoCompartido();
  const activeContext = contextAdapter || sharedContext;
  const addProducto = onAddProducto || activeContext.addProducto;
  const [mostrarModalFlete, setMostrarModalFlete] = useState(false);

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
    limpiarSeleccion
  } = useProductoSearch();

  const handleAgregarProducto = () => {
    if (!productoSeleccionado || cantidad <= 0) return;
    
    // Validación de stock
    if (cantidad > productoSeleccionado.stock_actual) {
      toast.error(`NO HAY STOCK DISPONIBLE PARA ${productoSeleccionado.nombre.toUpperCase()}.`);
      return;
    }
    
    // Validación adicional por si el producto no tiene stock
    if (productoSeleccionado.stock_actual === 0) {
      toast.error(`NO HAY STOCK DISPONIBLE PARA ${productoSeleccionado.nombre.toUpperCase()}.`);
      return;
    }
    
    addProducto(productoSeleccionado, cantidad, subtotal);
    limpiarSeleccion();
  };

  return (
    <div className={containerClassName}>
      <h2 className="text-2xl font-semibold mb-4 text-center">{title}</h2>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Buscar producto"
          className="flex-1 p-2 min-h-[44px] rounded text-black text-base"
          autoCapitalize="none"
          autoCorrect="off"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <button
          onClick={buscarProducto}
          disabled={loading}
          className="p-2 min-h-[44px] min-w-[44px] rounded bg-white text-blue-900 hover:bg-sky-300 transition disabled:opacity-50"
          title="Buscar producto"
        >
          <MdSearch size={24} />
        </button>
      </div>

      {mostrarBotonFletes && (
        <button
          type="button"
          onClick={() => setMostrarModalFlete(true)}
          className="w-full py-2.5 px-4 bg-white hover:bg-blue-50 text-blue-900 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 border border-blue-200"
        >
          FLETES
        </button>
      )}

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
          mostrarPreciosConIva={mostrarPreciosConIva}
        />
      )}

      <ModalAgregarFlete
        isOpen={mostrarModalFlete}
        onClose={() => setMostrarModalFlete(false)}
      />
    </div>
  );
}