import { useControlStock } from '../../context/ControlStockContext';
import { formatearStock } from '../../utils/formatearStock';

export default function ListaProductosStock() {
  const { productos, removeProducto } = useControlStock();

  return (
    <div className="mt-6">
      <h3 className="text-xl font-semibold mb-4">Productos Seleccionados ({productos.length})</h3>
      
      {productos.length === 0 ? (
        <div className="bg-white p-4 rounded shadow text-center text-gray-500">
          No hay productos agregados. Selecciona productos por categoría o busca manualmente.
        </div>
      ) : (
        <>
          {/* Tabla para escritorio */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse bg-white rounded shadow">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Código</th>
                  <th className="border p-2 text-left">Nombre</th>
                  <th className="border p-2 text-left">Categoría</th>
                  <th className="border p-2 text-center">Unidad</th>
                  <th className="border p-2 text-right">Stock Actual</th>
                  <th className="border p-2 text-center">Acción</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((producto, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border p-2">{producto.id}</td>
                    <td className="border p-2">{producto.nombre}</td>
                    <td className="border p-2">{producto.categoria_nombre}</td>
                    <td className="border p-2 text-center">{producto.unidad_medida}</td>
                    <td className={`border p-2 text-right font-medium ${
                      producto.stock_actual === 0 
                        ? 'text-red-600' 
                        : producto.stock_actual < 10 
                        ? 'text-orange-600' 
                        : 'text-green-600'
                    }`}>
                      {formatearStock(producto.stock_actual)}
                    </td>
                    <td className="border p-2 text-center">
                      <button
                        onClick={() => removeProducto(index)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tarjetas para móvil */}
          <div className="md:hidden space-y-3">
            {productos.map((producto, index) => (
              <div key={index} className="bg-white p-4 rounded shadow">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-gray-800">{producto.nombre}</p>
                    <p className="text-sm text-gray-600">Código: {producto.id}</p>
                    <p className="text-sm text-gray-600">Categoría: {producto.categoria_nombre}</p>
                  </div>
                  <button
                    onClick={() => removeProducto(index)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                  >
                    ×
                  </button>
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t">
                  <span className="text-sm text-gray-600">Unidad: {producto.unidad_medida}</span>
                  <span className={`font-bold ${
                    producto.stock_actual === 0 
                      ? 'text-red-600' 
                      : producto.stock_actual < 10 
                      ? 'text-orange-600' 
                      : 'text-green-600'
                  }`}>
                    Stock: {formatearStock(producto.stock_actual)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

