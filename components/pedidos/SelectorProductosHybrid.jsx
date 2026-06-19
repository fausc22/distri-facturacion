import { MdSearch } from 'react-icons/md';
import { toast } from 'react-hot-toast';
import { usePedidosContext } from '../../context/PedidosContext';
import { useProductoSearchHybrid } from '../../hooks/useProductSearchHybrid';
import ModalSeleccionProductos from '../shared/ModalSeleccionProductos';

export default function ProductoSelectorHybrid({ mostrarPreciosConIva = true }) {
  const { addProducto } = usePedidosContext();
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
    isPWA,
    isOnline,
  } = useProductoSearchHybrid();

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

  const getPlaceholder = () => {
    if (!isPWA) return 'Buscar producto';
    return isOnline ? 'Buscar producto (online)' : 'Buscar producto (offline)';
  };

  const getContainerClass = () => {
    const baseClass = 'bg-primary text-primary-foreground p-6 rounded-lg flex-1 min-w-0';
    if (!isPWA) return baseClass;
    const borderClass = isOnline ? 'border-l-4 border-green-400' : 'border-l-4 border-orange-400';
    return `${baseClass} ${borderClass}`;
  };

  const badgeHeader =
    isPWA ? (
      <div className="flex items-center gap-1.5 text-xs">
        <div className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-orange-500'}`} />
        <span className={isOnline ? 'text-green-600' : 'text-orange-600'}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>
    ) : null;

  return (
    <div className={getContainerClass()}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Productos</h2>
        {isPWA && (
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-400' : 'bg-orange-400'}`} />
            <span className={`text-sm font-medium ${isOnline ? 'text-green-200' : 'text-orange-200'}`}>
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder={getPlaceholder()}
          className={`flex-1 p-2 min-h-[44px] rounded text-black text-base ${
            isPWA && !isOnline ? 'bg-orange-50 border-orange-300' : ''
          }`}
          autoCapitalize="none"
          autoCorrect="off"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && buscarProducto()}
        />
        <button
          onClick={buscarProducto}
          disabled={loading}
          className={`p-2 min-h-[44px] min-w-[44px] rounded transition ${
            loading
              ? 'bg-gray-400 cursor-not-allowed text-gray-600'
              : isOnline
                ? 'bg-white text-blue-900 hover:bg-sky-300'
                : 'bg-orange-200 text-orange-800 hover:bg-orange-300'
          }`}
          title={
            isPWA
              ? isOnline
                ? 'Buscar producto online'
                : 'Buscar producto en datos offline'
              : 'Buscar producto'
          }
        >
          {loading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current" />
          ) : (
            <MdSearch size={24} />
          )}
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
          mostrarPreciosConIva={mostrarPreciosConIva}
          badgeHeader={badgeHeader}
          mensajeSinResultados={
            isPWA && !isOnline
              ? 'No se encontraron productos en datos offline.'
              : 'No se encontraron resultados.'
          }
        />
      )}
    </div>
  );
}
