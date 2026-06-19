import { MdSearch } from 'react-icons/md';
import { toast } from 'react-hot-toast';
import { useVenta } from '../../context/VentasContext';
import { useProductoSearch } from '../../hooks/useBusquedaProductos';
import ModalSeleccionProductos from '../shared/ModalSeleccionProductos';

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
    buscarProducto,
    seleccionarProducto,
    actualizarCantidad,
    deseleccionarProducto,
    cerrarModal,
  } = useProductoSearch();

  const handleAgregarProducto = () => {
    if (!productoSeleccionado || cantidad <= 0) return;

    addProducto(productoSeleccionado, cantidad, subtotal);
    deseleccionarProducto();
    toast.success('Producto agregado');
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
          onKeyDown={(e) => e.key === 'Enter' && buscarProducto()}
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
        <ModalSeleccionProductos
          resultados={resultados}
          productoSeleccionado={productoSeleccionado}
          cantidad={cantidad}
          subtotal={subtotal}
          busqueda={busqueda}
          onBusquedaChange={setBusqueda}
          onBuscar={buscarProducto}
          onSeleccionar={seleccionarProducto}
          onDeseleccionar={deseleccionarProducto}
          onCantidadChange={actualizarCantidad}
          onAgregar={handleAgregarProducto}
          onCerrar={cerrarModal}
          loading={loading}
        />
      )}
    </div>
  );
}
