// components/notas/ModalProductoManual.jsx
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export function ModalProductoManual({ mostrar, onClose, onGuardar }) {
  const [nombre, setNombre] = useState('');
  const [unidadMedida, setUnidadMedida] = useState('Unidad');
  const [cantidad, setCantidad] = useState(1);
  const [precio, setPrecio] = useState(0);
  const [porcentajeIva, setPorcentajeIva] = useState(21);
  const [subtotal, setSubtotal] = useState(0);
  const [editandoSubtotal, setEditandoSubtotal] = useState(false);

  // Calcular subtotal automáticamente
  useEffect(() => {
    if (!editandoSubtotal) {
      const nuevoSubtotal = parseFloat((cantidad * precio).toFixed(2));
      setSubtotal(nuevoSubtotal);
    }
  }, [cantidad, precio, editandoSubtotal]);

  // Recalcular precio si se edita el subtotal
  const handleSubtotalChange = (e) => {
    const nuevoSubtotal = parseFloat(e.target.value) || 0;
    setSubtotal(nuevoSubtotal);
    
    if (cantidad > 0) {
      const nuevoPrecio = parseFloat((nuevoSubtotal / cantidad).toFixed(2));
      setPrecio(nuevoPrecio);
    }
  };

  const handleGuardar = () => {
    if (!nombre.trim()) {
      toast.error('El nombre del producto es requerido');
      return;
    }

    if (cantidad <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }

    if (precio < 0) {
      toast.error('El precio no puede ser negativo');
      return;
    }

    if (subtotal <= 0) {
      toast.error('El subtotal debe ser mayor a 0');
      return;
    }

    const productoManual = {
      nombre: nombre.trim(),
      unidad_medida: unidadMedida,
      cantidad: parseFloat(cantidad),
      precio: parseFloat(precio),
      porcentaje_iva: parseFloat(porcentajeIva),
      subtotal: parseFloat(subtotal),
      iva_calculado: parseFloat((subtotal * (porcentajeIva / 100)).toFixed(2)),
      esManual: true
    };

    onGuardar(productoManual);
    
    // Limpiar formulario
    setNombre('');
    setUnidadMedida('Unidad');
    setCantidad(1);
    setPrecio(0);
    setPorcentajeIva(21);
    setSubtotal(0);
    setEditandoSubtotal(false);
  };

  const handleClose = () => {
    // Limpiar formulario
    setNombre('');
    setUnidadMedida('Unidad');
    setCantidad(1);
    setPrecio(0);
    setPorcentajeIva(21);
    setSubtotal(0);
    setEditandoSubtotal(false);
    onClose();
  };

  if (!mostrar) return null;

  const ivaCalculado = parseFloat((subtotal * (porcentajeIva / 100)).toFixed(2));
  const total = subtotal + ivaCalculado;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[80] p-2 sm:p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">
              Agregar Producto Manual
            </h2>
            <button 
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 text-xl p-1"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            {/* Nombre del producto */}
            <div>
              <label className="block mb-1 font-medium text-sm text-gray-700">
                Nombre / Descripción *
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Servicio de instalación, Descuento por promoción, etc."
                className="border p-2 w-full rounded text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Puede ser una descripción o explicación del concepto
              </p>
            </div>

            {/* Unidad de medida */}
            <div>
              <label className="block mb-1 font-medium text-sm text-gray-700">
                Unidad de Medida
              </label>
              <input
                type="text"
                value={unidadMedida}
                onChange={(e) => setUnidadMedida(e.target.value)}
                className="border p-2 w-full rounded text-sm"
              />
            </div>

            {/* Cantidad */}
            <div>
              <label className="block mb-1 font-medium text-sm text-gray-700">
                Cantidad *
              </label>
              <input
                type="number"
                value={cantidad}
                onChange={(e) => setCantidad(parseFloat(e.target.value) || 1)}
                min="0.5"
                step="0.5"
                className="border p-2 w-full rounded text-sm"
              />
            </div>

            {/* Precio unitario */}
            <div>
              <label className="block mb-1 font-medium text-sm text-gray-700">
                Precio Unitario ($) *
              </label>
              <input
                type="number"
                value={precio}
                onChange={(e) => setPrecio(parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                className="border p-2 w-full rounded text-sm"
              />
            </div>

            {/* Porcentaje IVA */}
            <div>
              <label className="block mb-1 font-medium text-sm text-gray-700">
                IVA (%) *
              </label>
              <input
                type="number"
                value={porcentajeIva}
                onChange={(e) => setPorcentajeIva(parseFloat(e.target.value) || 21)}
                min="0"
                max="100"
                step="0.1"
                className="border p-2 w-full rounded text-sm"
              />
            </div>

            {/* Subtotal (editable) */}
            <div>
              <label className="block mb-1 font-medium text-sm text-gray-700">
                Subtotal ($) *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={subtotal}
                  onChange={handleSubtotalChange}
                  onFocus={() => setEditandoSubtotal(true)}
                  onBlur={() => setEditandoSubtotal(false)}
                  min="0"
                  step="0.01"
                  className="border p-2 flex-1 rounded text-sm"
                />
                <button
                  onClick={() => {
                    const nuevoSubtotal = parseFloat((cantidad * precio).toFixed(2));
                    setSubtotal(nuevoSubtotal);
                    setEditandoSubtotal(false);
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm"
                  title="Recalcular desde cantidad × precio"
                >
                  🔄
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Puede editar el subtotal directamente o recalcular desde cantidad × precio
              </p>
            </div>

            {/* Resumen */}
            <div className="bg-gray-50 border border-gray-200 p-3 rounded">
              <h4 className="font-medium text-sm mb-2 text-gray-800">Resumen:</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IVA ({porcentajeIva}%):</span>
                  <span>${ivaCalculado.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-blue-600 border-t pt-1">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
            <button
              onClick={handleGuardar}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              AGREGAR PRODUCTO
            </button>
            <button
              onClick={handleClose}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              CANCELAR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

