import { MdSearch } from 'react-icons/md';
import { toast } from 'react-hot-toast';
import { useState } from 'react';
import { axiosAuth } from '../../utils/apiClient';
import { useControlStock } from '../../context/ControlStockContext';
import { useProductoSearch } from '../../hooks/useBusquedaProductos';
import { formatearStock } from '../../utils/formatearStock';

function ModalProductos({ 
  resultados, 
  productoSeleccionado,
  onSeleccionar, 
  onAgregar,
  onCerrar, 
  loading 
}) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white rounded-lg p-4 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4 text-black">Seleccionar Producto</h3>
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
                  <span>{producto.nombre}</span>
                  <span className={`text-sm ${
                    producto.stock_actual > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    Stock: {formatearStock(producto.stock_actual)}
                  </span>
                </div>
              </li>
            ))
          ) : (
            <li className="text-gray-500">No se encontraron resultados.</li>
          )}
        </ul>

        {productoSeleccionado && (
          <div className="mt-4 p-3 bg-gray-50 rounded">
            <p className="font-semibold">{productoSeleccionado.nombre}</p>
            <p className="text-sm text-gray-600">
              Stock actual: <span className="font-medium">{formatearStock(productoSeleccionado.stock_actual)}</span>
            </p>
            <button
              onClick={onAgregar}
              className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              Agregar a Lista
            </button>
          </div>
        )}

        <button
          onClick={onCerrar}
          className="mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded w-full"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

export default function SelectorProductosStock() {
  const { addProducto } = useControlStock();
  const {
    busqueda,
    setBusqueda,
    resultados,
    productoSeleccionado,
    loading,
    mostrarModal,
    setMostrarModal,
    buscarProducto,
    seleccionarProducto,
    limpiarSeleccion
  } = useProductoSearch();

  const handleAgregarProducto = () => {
    if (!productoSeleccionado) return;
    
    // Formatear producto para agregar al contexto
    const productoFormateado = {
      id: productoSeleccionado.id,
      nombre: productoSeleccionado.nombre,
      unidad_medida: productoSeleccionado.unidad_medida || 'Unidad',
      stock_actual: parseFloat(productoSeleccionado.stock_actual) || 0,
      categoria_id: productoSeleccionado.categoria_id || null,
      categoria_nombre: productoSeleccionado.categoria_nombre || 'Sin Categoría'
    };
    
    addProducto(productoFormateado);
    limpiarSeleccion();
    toast.success(`${productoSeleccionado.nombre} agregado a la lista.`);
  };

  return (
    <div className="bg-blue-900 p-4 sm:p-6 rounded-lg text-white">
      <h3 className="text-lg sm:text-xl font-semibold mb-4 text-center">Buscar Producto</h3>

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
          onSeleccionar={seleccionarProducto}
          onAgregar={handleAgregarProducto}
          onCerrar={() => setMostrarModal(false)}
          loading={loading}
        />
      )}
    </div>
  );
}

