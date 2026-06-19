import { useState } from 'react';
import { MdSearch } from 'react-icons/md';
import { toast } from 'react-hot-toast';
import { useContextoCompartido } from '../../hooks/shared/useContextoCompartido';
import { useProductoSearch } from '../../hooks/useBusquedaProductos';
import { ModalAgregarFlete } from '../ventas/ModalAgregarFlete';
import ModalSeleccionProductos from '../shared/ModalSeleccionProductos';

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
    buscarProducto,
    seleccionarProducto,
    actualizarCantidad,
    deseleccionarProducto,
    cerrarModal,
  } = useProductoSearch();

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
    deseleccionarProducto();
    toast.success('Producto agregado');
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
          onKeyDown={(e) => e.key === 'Enter' && buscarProducto()}
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
