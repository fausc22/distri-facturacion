// components/notas/ModalBuscarVenta.jsx
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { MdSearch } from 'react-icons/md';
import ModalBase from '../common/ModalBase';
import LoadingButton from '../common/LoadingButton';
import LoadingSpinner from '../common/LoadingSpinner';
import { Z_INDEX } from '../../constants/zIndex';

export function ModalBuscarVenta({ mostrar, onClose, onSeleccionarVenta, buscarVentas }) {
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);

  const handleBuscar = async () => {
    if (!busqueda.trim() || busqueda.trim().length < 2) {
      toast.error('Ingrese al menos 2 caracteres para buscar');
      return;
    }

    setBuscando(true);
    try {
      const ventas = await buscarVentas(busqueda);
      setResultados(ventas);
      
      if (ventas.length === 0) {
        toast.info('No se encontraron ventas');
      }
    } catch (error) {
      console.error('Error buscando ventas:', error);
      toast.error('Error al buscar ventas');
    } finally {
      setBuscando(false);
    }
  };

  const handleSeleccionar = (venta) => {
    onSeleccionarVenta(venta);
    setBusqueda('');
    setResultados([]);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleBuscar();
    }
  };

  if (!mostrar) return null;

  return (
    <ModalBase
      isOpen={mostrar}
      onClose={onClose}
      title="Buscar Venta de Referencia"
      size="lg"
      closeOnOverlay
      closeOnEscape
      zIndex={Z_INDEX.MODAL_NESTED}
      panelClassName="max-w-2xl max-h-[90vh] p-4 sm:p-6"
      showHeader={false}
    >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800">
              Buscar Venta de Referencia
            </h3>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl p-1 min-h-[44px] min-w-[44px] transition-transform active:scale-95"
              aria-label="Cerrar búsqueda de venta"
            >
              ✕
            </button>
          </div>

          {/* Búsqueda */}
          <div className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Buscar por número de factura o nombre de cliente..."
                className="flex-1 border p-2 rounded text-sm"
              />
              <LoadingButton
                onClick={handleBuscar}
                loading={buscando}
                loadingText="Buscando..."
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded flex items-center gap-2"
              >
                <MdSearch />
                Buscar
              </LoadingButton>
            </div>
          </div>

          {/* Resultados */}
          <div className="border rounded-lg max-h-96 overflow-y-auto">
            {buscando ? (
              <div className="p-8 text-center text-gray-500">
                <LoadingSpinner size="lg" colorClass="border-blue-600" className="mx-auto mb-2" />
                Buscando ventas...
              </div>
            ) : resultados.length > 0 ? (
              <div className="divide-y">
                {resultados.map((venta) => (
                  <div
                    key={venta.id}
                    onClick={() => handleSeleccionar(venta)}
                    className="p-4 hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-800">
                          {venta.numero_factura}
                        </p>
                        <p className="text-sm text-gray-600">
                          Cliente: {venta.cliente_nombre}
                        </p>
                        <p className="text-xs text-gray-500">
                          Fecha: {new Date(venta.fecha).toLocaleDateString('es-AR')} | 
                          Tipo: {venta.tipo_f} | 
                          Total: ${venta.total}
                        </p>
                      </div>
                      <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm">
                        Seleccionar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : busqueda.trim().length >= 2 ? (
              <div className="p-8 text-center text-gray-500">
                No se encontraron ventas
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400">
                Ingrese al menos 2 caracteres para buscar
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              Cancelar
            </button>
          </div>
    </ModalBase>
  );
}

