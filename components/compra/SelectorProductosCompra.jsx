import { MdSearch } from "react-icons/md";
import { useEffect } from 'react';
import { useCompra } from '../../context/ComprasContext';
import { useProductoSearchCompra } from '../../hooks/compra/useBusquedaProductosCompra';
import { toast } from 'react-hot-toast';

// Formateador de moneda
const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS'
  }).format(value);
};

function ModalProductos({ 
  resultados, 
  onSeleccionar, 
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
        <h3 className="mb-4 shrink-0 text-lg font-semibold">Seleccionar Producto</h3>
        <ul className="min-h-0 flex-1 overflow-y-auto pr-1 sm:max-h-[70vh]">
          {loading ? (
            <li className="text-center text-gray-500">Buscando...</li>
          ) : resultados.length > 0 ? (
            resultados.map((producto, idx) => (
              <li
                key={idx}
                className="cursor-pointer border-b p-2 text-black hover:bg-gray-100"
                onClick={() => onSeleccionar(producto)}
              >
                <p className="text-sm font-medium leading-snug sm:text-base whitespace-normal break-words">
                  {producto.nombre}
                </p>
                <div className="mt-1 flex flex-col gap-1 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                  <span className="shrink-0">
                    Stock: {producto.stock_actual || 0} {producto.unidad_medida}
                  </span>
                  <span className="sm:text-right">
                    Costo: {formatCurrency(producto.costo || 0)} | Venta: {formatCurrency(producto.precio || 0)}
                  </span>
                </div>
              </li>
            ))
          ) : (
            <li className="text-gray-500">No se encontraron resultados.</li>
          )}
        </ul>
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

function DetallesProducto({ 
  producto, 
  cantidad, 
  precioCosto, 
  precioVenta, 
  subtotal, 
  onCantidadChange, 
  onPrecioCostoChange,
  onPrecioVentaChange,
  onAgregar 
}) {
  if (!producto) return null;

  const handleAgregar = () => {
    if (precioCosto <= 0) {
      toast.error('El precio de costo debe ser mayor a 0');
      return;
    }
    
    if (precioVenta <= 0) {
      toast.error('El precio de venta debe ser mayor a 0');
      return;
    }
    
    if (cantidad <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }
    
    onAgregar();
  };

  return (
    <div className="bg-blue-50 p-6 rounded-lg mb-8">
      <h2 className="text-xl font-semibold mb-4">Agregar Productos</h2>
      
      {/* Información del producto seleccionado */}
      <div className="bg-green-100 p-3 rounded mb-4">
        <p className="font-medium">{producto.nombre}</p>
        <p className="text-sm">Unidad: {producto.unidad_medida || '-'}</p>
      </div>
      
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="w-full md:w-auto">
          <label htmlFor="cantidad" className="block text-sm font-medium text-gray-700 mb-2">
            Cantidad
          </label>
          <input
            id="cantidad"
            type="number"
            min="1"
            value={cantidad}
            onChange={(e) => onCantidadChange(parseInt(e.target.value) || 1)}
            className="w-24 p-2 rounded border border-gray-300"
          />
        </div>
        
        <div className="w-full md:w-auto">
          <label htmlFor="precioCosto" className="block text-sm font-medium text-gray-700 mb-2">
            Precio Costo ($)
          </label>
          <input
            id="precioCosto"
            type="number"
            min="0"
            step="0.01"
            value={precioCosto}
            onChange={(e) => onPrecioCostoChange(parseFloat(e.target.value) || 0)}
            className="w-32 p-2 rounded border border-gray-300"
          />
        </div>
        
        <div className="w-full md:w-auto">
          <label htmlFor="precioVenta" className="block text-sm font-medium text-gray-700 mb-2">
            Precio Venta ($)
          </label>
          <input
            id="precioVenta"
            type="number"
            min="0"
            step="0.01"
            value={precioVenta}
            onChange={(e) => onPrecioVentaChange(parseFloat(e.target.value) || 0)}
            className="w-32 p-2 rounded border border-gray-300"
          />
        </div>
      </div>
      
      <div className="flex flex-wrap justify-between items-center mt-4">
        <div className="space-x-4">
          <span className="text-lg font-bold">
            Subtotal: {formatCurrency(subtotal)}
          </span>
        </div>
        
        <button
          onClick={handleAgregar}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
        >
          Agregar Producto
        </button>
      </div>
    </div>
  );
}

export default function SelectorProductosCompra() {
  const { addProducto } = useCompra();
  const {
    busqueda,
    setBusqueda,
    resultados,
    productoSeleccionado,
    cantidad,
    precioCosto,
    precioVenta,
    subtotal,
    loading,
    mostrarModal,
    setMostrarModal,
    buscarProducto,
    seleccionarProducto,
    actualizarCantidad,
    actualizarPrecioCosto,
    setPrecioVenta,
    limpiarSeleccion
  } = useProductoSearchCompra();

  const handleAgregarProducto = () => {
    if (!productoSeleccionado) return;
    
    addProducto(productoSeleccionado, cantidad, precioCosto, precioVenta, subtotal);
    limpiarSeleccion();
    toast.success('Producto agregado al carrito');
  };

  return (
    <div className="flex-1">
      {/* Campo de búsqueda */}
      <div className="bg-blue-50 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Buscar Productos</h2>
        
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Buscar producto"
            className="flex-1 p-2 rounded border border-gray-300"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <button
            onClick={buscarProducto}
            disabled={loading}
            className="p-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
            title="Buscar producto"
          >
            <MdSearch size={24} />
          </button>
        </div>
      </div>

      {/* Detalles del producto seleccionado */}
      {productoSeleccionado && (
        <DetallesProducto
          producto={productoSeleccionado}
          cantidad={cantidad}
          precioCosto={precioCosto}
          precioVenta={precioVenta}
          subtotal={subtotal}
          onCantidadChange={actualizarCantidad}
          onPrecioCostoChange={actualizarPrecioCosto}
          onPrecioVentaChange={setPrecioVenta}
          onAgregar={handleAgregarProducto}
        />
      )}

      {/* Modal de productos */}
      {mostrarModal && (
        <ModalProductos
          resultados={resultados}
          onSeleccionar={seleccionarProducto}
          onCerrar={() => setMostrarModal(false)}
          loading={loading}
        />
      )}
    </div>
  );
}