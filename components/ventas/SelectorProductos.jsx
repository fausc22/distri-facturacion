import { useEffect } from 'react';
import { MdSearch } from "react-icons/md";
import { useVenta } from '../../context/VentasContext';
import { useProductoSearch } from '../../hooks/useBusquedaProductos';

function ControlCantidad({ cantidad, onCantidadChange, className = "" }) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <button 
        className="bg-gray-300 hover:bg-gray-400 text-black w-8 h-8 rounded flex items-center justify-center font-bold"
        onClick={() => onCantidadChange(Math.max(0.5, cantidad - 0.5))}
      >
        -
      </button>
      <input
        type="number"
        value={cantidad}
        onChange={(e) => onCantidadChange(Math.max(0.5, Number(e.target.value)))}
        min="0.5"
        step="0.5"
        className="w-16 p-2 rounded text-black border border-gray-300 text-center"
      />
      <button 
        className="bg-gray-300 hover:bg-gray-400 text-black w-8 h-8 rounded flex items-center justify-center font-bold"
        onClick={() => onCantidadChange(cantidad + 0.5)}
      >
        +
      </button>
    </div>
  );
}

function DetallesProducto({ producto, cantidad, subtotal, onCantidadChange, onAgregar }) {
  if (!producto) return null;

  // Calcular precio con IVA incluido
  const precioConIva = parseFloat(producto.precio) * 1.21;

  return (
    <div className="mt-4">
      <div className="mb-2 text-xl font-bold text-green-700">
        STOCK DISPONIBLE: {producto.stock_actual}
      </div>
      <div className="mb-2 text-black">
        Precio unitario (IVA incluido): ${precioConIva.toFixed(2)}
      </div>
      
      <div className="flex items-center gap-4 mb-4">
        <label htmlFor="cantidad" className="text-black">Cantidad:</label>
        <ControlCantidad 
          cantidad={cantidad}
          onCantidadChange={onCantidadChange}
        />
      </div>

      <div className="text-black font-semibold mb-4">
        Subtotal (IVA incluido): ${(precioConIva * cantidad).toFixed(2)}
      </div>

      <button
        onClick={onAgregar}
        className="bg-green-600 hover:bg-green-800 text-white px-6 py-2 rounded"
      >
        Agregar Producto
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
        <h3 className="mb-4 shrink-0 text-lg font-semibold text-black">Seleccionar Producto</h3>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1 sm:max-h-[70vh]">
          <ul>
            {loading ? (
              <li className="text-center text-gray-500">Buscando...</li>
            ) : resultados.length > 0 ? (
              resultados.map((producto, idx) => {
                const precioConIva = parseFloat(producto.precio) * 1.21;
                return (
                  <li
                    key={idx}
                    className="cursor-pointer border-b p-2 text-black hover:bg-gray-100"
                    onClick={() => onSeleccionar(producto)}
                  >
                    <p className="text-sm font-medium leading-snug sm:text-base whitespace-normal break-words">
                      {producto.nombre}
                    </p>
                    <p className="text-sm text-gray-700">
                      ${precioConIva.toFixed(2)} (IVA incl.)
                    </p>
                  </li>
                );
              })
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
        </div>

        <button
          onClick={onCerrar}
          className="mt-4 shrink-0 bg-red-500 px-4 py-2 text-white hover:bg-red-600 sm:rounded"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

export default function ProductoSelector() {
  const { addProducto } = useVenta();
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
    
    addProducto(productoSeleccionado, cantidad, subtotal);
    limpiarSeleccion();
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