/**
 * Modal para agregar una línea de flete personalizada en Venta Directa.
 * Descripción y precio editables; IVA 21% o 0%. Se usa el producto plantilla "FLETE DE HACIENDA".
 */
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { axiosAuth } from '../../utils/apiClient';
import { useContextoCompartido } from '../../hooks/shared/useContextoCompartido';

const SUBTOTAL_MAX = 99999999.99;

export function ModalAgregarFlete({ isOpen, onClose }) {
  const { addProducto } = useContextoCompartido();

  const [productoBase, setProductoBase] = useState(null);
  const [loadingProducto, setLoadingProducto] = useState(false);
  const [errorProducto, setErrorProducto] = useState(null);

  const [descripcion, setDescripcion] = useState('');
  const [subtotal, setSubtotal] = useState('');
  const [ivaPorcentaje, setIvaPorcentaje] = useState(21);
  const [guardando, setGuardando] = useState(false);

  // Cerrar con Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !guardando) handleCerrar();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, guardando]);

  // Cargar producto plantilla al abrir
  useEffect(() => {
    if (!isOpen) return;

    setErrorProducto(null);
    setLoadingProducto(true);
    axiosAuth
      .get('/productos/producto-flete-hacienda')
      .then((res) => {
        if (res.data?.success && res.data?.data) {
          const p = res.data.data;
          setProductoBase(p);
          setDescripcion(p.nombre || 'FLETE DE HACIENDA');
          setSubtotal('');
          setIvaPorcentaje(Number(p.iva) === 0 ? 0 : 21);
        } else {
          setErrorProducto('No se recibió el producto de flete.');
        }
      })
      .catch((err) => {
        const msg = err.response?.data?.message || err.message || 'Error al cargar el producto de flete';
        setErrorProducto(msg);
        toast.error(msg);
      })
      .finally(() => setLoadingProducto(false));
  }, [isOpen]);

  const subtotalNum = parseFloat(subtotal) || 0;
  const ivaMonto = parseFloat((subtotalNum * (ivaPorcentaje / 100)).toFixed(2));
  const total = parseFloat((subtotalNum + ivaMonto).toFixed(2));

  const handleConfirmar = (e) => {
    e?.preventDefault();
    if (!productoBase || guardando) return;

    const descTrim = descripcion.trim();
    if (!descTrim) {
      toast.error('La descripción no puede estar vacía.');
      return;
    }

    const subtotalVal = parseFloat(subtotal);
    if (isNaN(subtotalVal) || subtotalVal <= 0) {
      toast.error('El subtotal debe ser mayor a 0.');
      return;
    }
    if (subtotalVal > SUBTOTAL_MAX) {
      toast.error(`El subtotal no puede superar ${SUBTOTAL_MAX.toLocaleString('es-AR')}.`);
      return;
    }

    const subtotalRedondeado = parseFloat(subtotalVal.toFixed(2));
    const ivaCalculado = parseFloat((subtotalRedondeado * (ivaPorcentaje / 100)).toFixed(2));

    setGuardando(true);
    try {
      const producto = {
        id: productoBase.id,
        nombre: descTrim,
        unidad_medida: productoBase.unidad_medida || 'Unidades',
        precio: subtotalRedondeado,
        iva: ivaPorcentaje,
        descuento_porcentaje: 0,
      };
      addProducto(producto, 1);
      toast.success('Flete agregado al carrito.');
      onClose();
    } catch (err) {
      console.error('Error al agregar flete:', err);
      toast.error('Error al agregar el flete.');
    } finally {
      setGuardando(false);
    }
  };

  const handleCerrar = () => {
    if (!guardando) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[60] p-4"
      onClick={(e) => e.target === e.currentTarget && handleCerrar()}
    >
      <div
        className="bg-white rounded-lg max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 md:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">Agregar flete</h2>
            <button
              type="button"
              onClick={handleCerrar}
              disabled={guardando}
              className="text-gray-500 hover:text-gray-700 disabled:opacity-50 text-xl p-1 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>

          {loadingProducto && (
            <p className="text-gray-600 text-center py-4">Cargando producto de flete...</p>
          )}

          {errorProducto && !loadingProducto && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {errorProducto}
            </div>
          )}

          {productoBase && !loadingProducto && (
            <form onSubmit={handleConfirmar} className="space-y-4">
              <div>
                <label className="block mb-1 font-medium text-sm text-gray-700">Descripción</label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej: FLETE DE HACIENDA A BUENOS AIRES"
                  rows={3}
                  className="w-full border border-gray-300 rounded-md p-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={guardando}
                />
              </div>

              <div>
                <label className="block mb-1 font-medium text-sm text-gray-700">Subtotal (sin IVA)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={subtotal}
                  onChange={(e) => setSubtotal(e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-gray-300 rounded-md p-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={guardando}
                />
              </div>

              <div>
                <label className="block mb-1 font-medium text-sm text-gray-700">IVA</label>
                <select
                  value={ivaPorcentaje}
                  onChange={(e) => setIvaPorcentaje(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-md p-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={guardando}
                >
                  <option value={21}>21%</option>
                  <option value={0}>0% (exento)</option>
                </select>
              </div>

              {(subtotalNum > 0 || ivaPorcentaje !== 0) && (
                <div className="rounded-md bg-gray-50 border border-gray-200 p-3 text-sm">
                  <p className="text-gray-600">
                    IVA: <span className="font-semibold text-gray-900">${ivaMonto.toFixed(2)}</span>
                  </p>
                  <p className="text-gray-600 mt-1">
                    Total: <span className="font-semibold text-green-700">${total.toFixed(2)}</span>
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCerrar}
                  disabled={guardando}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando || !descripcion.trim() || subtotalNum <= 0}
                  className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {guardando ? 'Agregando...' : 'Agregar flete'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default ModalAgregarFlete;
