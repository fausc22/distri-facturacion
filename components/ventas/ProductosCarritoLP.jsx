import { useListaPrecios } from '../../context/ListaPreciosContext';

function ControlCantidad({ cantidad, onCantidadChange }) {
  return (
    <div className="flex items-center justify-center space-x-2">
      <button 
        className="bg-gray-300 hover:bg-gray-400 text-black w-6 h-6 rounded flex items-center justify-center"
        onClick={() => onCantidadChange(Math.max(0.5, cantidad - 0.5))}
      >
        -
      </button>
      <span>{cantidad}</span>
      <button 
        className="bg-gray-300 hover:bg-gray-400 text-black w-6 h-6 rounded flex items-center justify-center"
        onClick={() => onCantidadChange(cantidad + 0.5)}
      >
        +
      </button>
    </div>
  );
}

function TablaEscritorio({ productos, onActualizarCantidad, onEliminar }) {
  return (
    <div className="hidden md:block overflow-x-auto bg-white rounded shadow text-black">
      <table className="w-full">
        <thead className="bg-gray-200">
          <tr>
            <th className="p-2">Producto</th>
            <th className="p-2">Cantidad</th>
            <th className="p-2">Precio Unit. (IVA incl.)</th>
            <th className="p-2">Subtotal</th>
            <th className="p-2">Eliminar</th>
          </tr>
        </thead>
        <tbody>
          {productos.length > 0 ? (
            productos.map((prod, idx) => {
              // Calcular precio con IVA incluido
              const precioConIva = Number(prod.precio) * 1.21;
              const subtotalConIva = precioConIva * prod.cantidad;
              
              return (
                <tr key={idx} className="text-center">
                  <td className="p-2">{prod.nombre}</td>
                  <td className="p-2">
                    <ControlCantidad
                      cantidad={prod.cantidad}
                      onCantidadChange={(nuevaCantidad) => onActualizarCantidad(idx, nuevaCantidad)}
                    />
                  </td>
                  <td className="p-2">${precioConIva.toFixed(2)}</td>
                  <td className="p-2">${subtotalConIva.toFixed(2)}</td>
                  <td className="p-2">
                    <button
                      className="bg-red-500 hover:bg-red-700 text-white px-2 py-1 rounded"
                      onClick={() => onEliminar(idx)}
                    >
                      X
                    </button>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="5" className="p-4 text-center text-gray-500">
                No hay productos agregados
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function TarjetasMovil({ productos, onActualizarCantidad, onEliminar }) {
  return (
    <div className="md:hidden space-y-4">
      {productos.length > 0 ? (
        productos.map((prod, idx) => {
          const precioConIva = Number(prod.precio) * 1.21;
          const subtotalConIva = precioConIva * prod.cantidad;
          
          return (
            <div key={idx} className="bg-white p-4 rounded shadow">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">{prod.nombre}</h4>
                <button
                  className="bg-red-500 hover:bg-red-700 text-white px-2 py-1 rounded"
                  onClick={() => onEliminar(idx)}
                >
                  X
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <span className="text-gray-600">Cantidad:</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <button 
                      className="bg-gray-300 hover:bg-gray-400 text-black w-6 h-6 rounded flex items-center justify-center"
                      onClick={() => onActualizarCantidad(idx, Math.max(0.5, prod.cantidad - 0.5))}
                    >
                      -
                    </button>
                    <span className="font-medium">{prod.cantidad}</span>
                    <button 
                      className="bg-gray-300 hover:bg-gray-400 text-black w-6 h-6 rounded flex items-center justify-center"
                      onClick={() => onActualizarCantidad(idx, prod.cantidad + 0.5)}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Precio (IVA incl.):</span>
                  <span className="ml-2 font-medium">${precioConIva.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="ml-2 font-medium">${subtotalConIva.toFixed(2)}</span>
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="bg-white p-4 rounded shadow text-center text-gray-500">
          No hay productos agregados
        </div>
      )}
    </div>
  );
}

export default function ProductosCarritoListaPrecios() {
  const { productos, removeProducto, updateCantidad, subtotal, totalIva, total } = useListaPrecios();

  const handleActualizarCantidad = (index, nuevaCantidad) => {
    const cantidadValida = Math.max(0.5, nuevaCantidad);
    updateCantidad(index, cantidadValida);
  };

  // Calcular total con IVA incluido
  const totalConIva = productos.reduce((acc, prod) => {
    const precioConIva = Number(prod.precio) * 1.21;
    return acc + (precioConIva * prod.cantidad);
  }, 0);

  return (
    <div className="mt-6">
      <h3 className="text-xl font-semibold mb-2">Productos Seleccionados</h3>
      
      <TablaEscritorio
        productos={productos}
        onActualizarCantidad={handleActualizarCantidad}
        onEliminar={removeProducto}
      />
      
      <TarjetasMovil
        productos={productos}
        onActualizarCantidad={handleActualizarCantidad}
        onEliminar={removeProducto}
      />
      
      {/* Total con IVA incluido */}
      <div className="mt-6 text-right">
        <p className="text-xl font-bold">Total (IVA incluido): ${totalConIva.toFixed(2)}</p>
      </div>
    </div>
  );
}