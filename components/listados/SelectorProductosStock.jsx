import { MdSearch } from 'react-icons/md';
import { toast } from 'react-hot-toast';
import { useControlStock } from '../../context/ControlStockContext';
import { useProductoSearch } from '../../hooks/useBusquedaProductos';
import ModalSeleccionProductos from '../shared/ModalSeleccionProductos';

export default function SelectorProductosStock() {
  const { addProducto } = useControlStock();
  const {
    busqueda,
    setBusqueda,
    resultados,
    productoSeleccionado,
    loading,
    mostrarModal,
    buscarProducto,
    seleccionarProducto,
    deseleccionarProducto,
    cerrarModal,
  } = useProductoSearch();

  const handleAgregarProducto = () => {
    if (!productoSeleccionado) return;

    const productoFormateado = {
      id: productoSeleccionado.id,
      nombre: productoSeleccionado.nombre,
      unidad_medida: productoSeleccionado.unidad_medida || 'Unidad',
      stock_actual: parseFloat(productoSeleccionado.stock_actual) || 0,
      categoria_id: productoSeleccionado.categoria_id || null,
      categoria_nombre: productoSeleccionado.categoria_nombre || 'Sin Categoría',
    };

    addProducto(productoFormateado);
    deseleccionarProducto();
    toast.success('Producto agregado a la lista');
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
          busqueda={busqueda}
          onBusquedaChange={setBusqueda}
          onBuscar={buscarProducto}
          onSeleccionar={seleccionarProducto}
          onDeseleccionar={deseleccionarProducto}
          onAgregar={handleAgregarProducto}
          onCerrar={cerrarModal}
          loading={loading}
          mostrarCantidad={false}
          mostrarPreciosConIva={false}
          textoAgregar="Agregar a lista"
          titulo="Seleccionar Producto"
        />
      )}
    </div>
  );
}
