import { MdSearch } from "react-icons/md";
import { toast } from 'react-hot-toast'; // Importar toast
import { useContextoCompartido } from '../../hooks/shared/useContextoCompartido';
import { useProductoSearch } from '../../hooks/useBusquedaProductos';

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
        className={`w-8 h-8 rounded flex items-center justify-center font-bold ${
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
        className="w-20 p-2 rounded text-black border border-gray-300 text-center"
        onBlur={(e) => {
          const valor = parseFloat(e.target.value);
          if (isNaN(valor) || valor < 0.5) {
            handleCantidadChange(0.5);
          }
        }}
      />
      <button 
        className={`w-8 h-8 rounded flex items-center justify-center font-bold ${
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

function DetallesProducto({ producto, cantidad, subtotal, onCantidadChange, onAgregar }) {
  if (!producto) return null;

  const formatearCantidad = (cantidad) => {
    const cantidadNum = parseFloat(cantidad);
    return cantidadNum % 1 === 0 ? cantidadNum.toString() : cantidadNum.toFixed(1);
  };

  const stockInsuficiente = cantidad > producto.stock_actual;

  return (
    <div className="mt-4">
      <div className={`mb-2 text-xl font-bold ${producto.stock_actual > 0 ? 'text-green-700' : 'text-red-600'}`}>
        STOCK DISPONIBLE: {formatearCantidad(producto.stock_actual)}
      </div>
      <div className="mb-2 text-black">
        Precio unitario: ${producto.precio}
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

      <div className="text-black font-semibold mb-4">
        Subtotal: ${Number(subtotal).toFixed(2)}
      </div>

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
  loading 
}) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white rounded-lg p-4 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4 text-black ">Seleccionar Producto</h3>
        <ul className="max-h-60 overflow-y-auto">
          {loading ? (
            <li className="text-gray-500 text-center">Buscando...</li>
          ) : resultados.length > 0 ? (
            resultados.map((producto, idx) => (
              <li
                key={idx}
                className={`p-2 border-b cursor-pointer text-black ${
                  producto.stock_actual > 0 
                    ? 'hover:bg-gray-100' 
                    : 'bg-red-50 text-red-600'
                }`}
                onClick={() => onSeleccionar(producto)}
              >
                <div className="flex justify-between items-center">
                  <span>{producto.nombre} - ${producto.precio}</span>
                  <span className={`text-sm ${
                    producto.stock_actual > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    Stock: {producto.stock_actual}
                  </span>
                </div>
              </li>
            ))
          ) : (
            <li className="text-gray-500">No se encontraron resultados.</li>
          )}
        </ul>

        <DetallesProducto
          producto={productoSeleccionado}
          cantidad={cantidad}
          subtotal={subtotal}
          onCantidadChange={onCantidadChange}
          onAgregar={onAgregar}
        />

        <button
          onClick={onCerrar}
          className="mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

export default function ProductoSelector({ onAddProducto = null }) {
  // ✅ Usar hook compartido que detecta automáticamente el contexto
  const contexto = useContextoCompartido();
  const addProducto = onAddProducto || contexto.addProducto;

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
    toast.success(`${productoSeleccionado.nombre} agregado al pedido.`);
  };

  return (
    <div className="bg-blue-500 p-6 rounded-lg flex-1 text-white">
      <h2 className="text-2xl font-semibold mb-4 text-center">Productos</h2>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Buscar producto"
          className="flex-1 p-2 rounded text-black"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <button
          onClick={buscarProducto}
          disabled={loading}
          className="p-2 rounded bg-white text-blue-900 hover:bg-sky-300 transition disabled:opacity-50"
          title="Buscar producto"
        >
          <MdSearch size={24} />
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
        />
      )}
    </div>
  );
}