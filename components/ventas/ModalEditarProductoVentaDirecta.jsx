// components/ventas/ModalEditarProductoVentaDirecta.jsx
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';

export function ModalEditarProductoVentaDirecta({
  producto,
  onClose,
  onGuardar,
  index
}) {
  // Hooks
  const { user } = useAuth();
  const [localCantidad, setLocalCantidad] = useState(0.5);
  const [localPrecio, setLocalPrecio] = useState(0);
  const [localDescuento, setLocalDescuento] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [inicializado, setInicializado] = useState(false);

  const esGerente = user?.rol === 'GERENTE';

  // Inicialización cuando cambia producto
  useEffect(() => {
    if (producto && !inicializado) {
      setLocalCantidad(Math.max(0.5, parseFloat(producto.cantidad) || 0.5));
      setLocalPrecio(Number(producto.precio) || 0);
      setLocalDescuento(Number(producto.descuento_porcentaje) || 0);
      setGuardando(false);
      setInicializado(true);
    }

    if (!producto) {
      setInicializado(false);
    }
  }, [producto, inicializado]);

  // Cleanup cuando se desmonta
  useEffect(() => {
    return () => {
      setGuardando(false);
      setInicializado(false);
    };
  }, []);

  // Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !guardando) {
        onClose();
      }
    };

    if (producto) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [producto, guardando, onClose]);

  // Early return después de todos los hooks
  if (!producto || !inicializado) {
    return null;
  }

  // Cálculos
  const stockDisponible = Number(producto.stock_actual) || 999999; // Stock alto para venta directa
  const stockSuficiente = true; // Siempre suficiente para venta directa
  const subtotalBase = localCantidad * localPrecio;
  const montoDescuento = (subtotalBase * localDescuento) / 100;
  const subtotalFinal = subtotalBase - montoDescuento;

  // Calcular IVA sobre el subtotal con descuento
  const porcentajeIva = Number(producto.porcentaje_iva) || 21;
  const ivaCalculado = (subtotalFinal * porcentajeIva) / 100;

  const botonesDeshabilitados = localPrecio <= 0 || guardando;

  // Handlers
  const handleCantidadInput = (e) => {
    if (guardando) return;
    let valor = parseFloat(e.target.value) || 0.5;

    // Redondear a medios más cercano
    valor = Math.round(valor * 2) / 2;

    const valorValido = Math.max(0.5, valor);
    setLocalCantidad(valorValido);
  };

  const handleCantidadBoton = (incremento) => {
    if (guardando) return;

    const nuevoIncremento = incremento > 0 ? 0.5 : -0.5;
    const nuevaCantidad = localCantidad + nuevoIncremento;

    // Redondear a medios más cercano
    const cantidadRedondeada = Math.round(nuevaCantidad * 2) / 2;

    const valorValido = Math.max(0.5, cantidadRedondeada);
    setLocalCantidad(valorValido);
  };

  const handlePrecioChange = (e) => {
    if (guardando) return;
    const valor = Math.max(0, parseFloat(e.target.value) || 0);
    setLocalPrecio(valor);
  };

  const handleDescuentoChange = (e) => {
    if (guardando) return;
    const valor = Math.max(0, Math.min(100, parseFloat(e.target.value) || 0));
    setLocalDescuento(valor);
  };

  const handleGuardarClick = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (guardando) return;

    if (localPrecio <= 0) {
      toast.error('El precio debe ser mayor a cero');
      return;
    }

    setGuardando(true);

    try {
      const productoActualizado = {
        ...producto,
        cantidad: localCantidad,
        precio: localPrecio,
        descuento_porcentaje: localDescuento,
        subtotal: parseFloat(subtotalFinal.toFixed(2)),
        iva_calculado: parseFloat(ivaCalculado.toFixed(2))
      };

      await onGuardar(index, productoActualizado);
      toast.success('Producto actualizado correctamente');
      onClose();
    } catch (error) {
      console.error('Error guardando:', error);
      toast.error('Error al guardar cambios');
      setGuardando(false);
    }
  };

  const handleCerrarClick = (e) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (guardando) return;
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !guardando) {
      handleCerrarClick();
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[80] p-4"
      onClick={handleOverlayClick}
    >
      <div
        className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 md:p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg sm:text-xl font-bold">Editar Producto</h2>
            <button
              type="button"
              onClick={handleCerrarClick}
              disabled={guardando}
              className="text-gray-500 hover:text-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed text-xl p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            {/* Información básica */}
            <div>
              <label className="block mb-1 font-medium text-sm">Código:</label>
              <input
                type="text"
                className="border p-2 w-full rounded bg-gray-100 text-sm"
                value={producto.id || ''}
                disabled
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-sm">Nombre:</label>
              <input
                type="text"
                className="border p-2 w-full rounded bg-gray-100 text-sm"
                value={producto.nombre || ''}
                disabled
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-sm">Unidad de Medida:</label>
              <input
                type="text"
                className="border p-2 w-full rounded bg-gray-100 text-sm"
                value={producto.unidad_medida || 'Unidad'}
                disabled
              />
            </div>

            {/* Precio */}
            {esGerente ? (
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                <label className="block mb-1 font-medium text-sm text-yellow-800">
                  Precio Unitario ($):
                </label>
                <div className="flex items-center">
                  <span className="mr-1 text-yellow-600">$</span>
                  <input
                    type="number"
                    disabled={guardando}
                    className="border border-yellow-300 p-2 w-full rounded text-sm focus:ring-2 focus:ring-yellow-500 disabled:bg-gray-100"
                    value={localPrecio}
                    onChange={handlePrecioChange}
                    min="0"
                    step="0.01"
                  />
                </div>
                <p className="text-xs text-yellow-600 mt-1">
                  Precio editable para gerentes
                </p>
              </div>
            ) : (
              <div>
                <label className="block mb-1 font-medium text-sm">Precio Unitario ($):</label>
                <div className="flex items-center">
                  <span className="mr-1 text-gray-600">$</span>
                  <input
                    type="text"
                    className="border p-2 w-full rounded bg-gray-100 text-sm"
                    value={localPrecio.toFixed(2)}
                    disabled
                  />
                </div>
              </div>
            )}

            {/* Cantidad */}
            <div>
              <label className="block mb-1 font-medium text-sm">Cantidad:</label>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  disabled={localCantidad <= 0.5 || guardando}
                  className="bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed text-black w-8 h-8 rounded flex items-center justify-center transition-colors"
                  onClick={() => handleCantidadBoton(-1)}
                >
                  -
                </button>
                <input
                  type="number"
                  disabled={guardando}
                  className="border p-2 w-20 rounded text-sm text-center disabled:bg-gray-100"
                  value={localCantidad}
                  onChange={handleCantidadInput}
                  min="0.5"
                  step="0.5"
                />
                <button
                  type="button"
                  disabled={guardando}
                  className="bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed text-black w-8 h-8 rounded flex items-center justify-center transition-colors"
                  onClick={() => handleCantidadBoton(1)}
                >
                  +
                </button>
              </div>
            </div>

            {/* Descuento */}
            {esGerente && (
              <div className="bg-orange-50 border border-orange-200 p-3 rounded">
                <label className="block mb-1 font-medium text-sm text-orange-800">
                  Descuento (%):
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    disabled={guardando}
                    className="border border-orange-300 p-2 w-20 rounded text-sm text-center focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100"
                    value={localDescuento}
                    onChange={handleDescuentoChange}
                    min="0"
                    max="100"
                    step="0.1"
                  />
                  <span className="text-orange-600">%</span>
                  <div className="flex-1 text-sm text-orange-700">
                    Descuento: <span className="font-bold">${montoDescuento.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Resumen */}
            <div className="bg-gray-50 border border-gray-200 p-3 rounded">
              <h4 className="font-medium text-sm mb-2 text-gray-800">Resumen:</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal base:</span>
                  <span>${subtotalBase.toFixed(2)}</span>
                </div>
                {localDescuento > 0 && (
                  <div className="flex justify-between text-orange-600">
                    <span>Descuento ({localDescuento}%):</span>
                    <span>-${montoDescuento.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold border-t pt-1">
                  <span>Subtotal final:</span>
                  <span className="text-green-600">${subtotalFinal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>IVA ({porcentajeIva}%):</span>
                  <span>${ivaCalculado.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-blue-600 border-t pt-1">
                  <span>Total con IVA:</span>
                  <span>${(subtotalFinal + ivaCalculado).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Loading */}
            {guardando && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  <span className="font-medium">Guardando cambios...</span>
                </div>
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
            <button
              type="button"
              onClick={handleGuardarClick}
              disabled={botonesDeshabilitados}
              className={`px-6 py-3 rounded-lg text-sm font-bold transition-colors w-full sm:w-auto min-w-[160px] flex items-center justify-center gap-2 ${
                botonesDeshabilitados
                  ? 'bg-gray-400 cursor-not-allowed text-gray-700'
                  : 'bg-green-600 hover:bg-green-700 text-white shadow-lg'
              }`}
            >
              {guardando && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}

              {guardando ? 'Guardando...' :
               localPrecio <= 0 ? 'Precio Inválido' :
               'GUARDAR CAMBIOS'}
            </button>

            <button
              type="button"
              onClick={handleCerrarClick}
              disabled={guardando}
              className={`px-6 py-3 rounded-lg text-sm font-bold transition-colors w-full sm:w-auto min-w-[160px] flex items-center justify-center gap-2 ${
                guardando
                  ? 'bg-gray-400 cursor-not-allowed text-gray-700'
                  : 'bg-red-600 hover:bg-red-700 text-white shadow-lg'
              }`}
            >
              CANCELAR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalEditarProductoVentaDirecta;
