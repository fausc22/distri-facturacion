import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { axiosAuth } from '../../utils/apiClient';

export default function ModalEditarProductoStock({
  producto,
  isOpen,
  onClose,
  onProductoActualizado,
  categorias = []
}) {
  const [formData, setFormData] = useState({
    nombre: '',
    categoria_id: '',
    stock_actual: ''
  });
  const [loading, setLoading] = useState(false);
  const [stockReservado, setStockReservado] = useState(0);

  useEffect(() => {
    if (producto) {
      setFormData({
        nombre: producto.nombre || '',
        categoria_id: producto.categoria_id || '',
        stock_actual: producto.stock_actual || ''
      });
    }
  }, [producto]);

  useEffect(() => {
    if (!isOpen || !producto?.id) {
      setStockReservado(0);
      return;
    }

    let cancelled = false;

    const cargarStockReservado = async () => {
      try {
        const response = await axiosAuth.get(`/productos/stock-reservado/${producto.id}`);
        if (!cancelled && response.data.success) {
          setStockReservado(parseFloat(response.data.data.reservado) || 0);
        }
      } catch (error) {
        console.warn('No se pudo cargar stock reservado:', error);
        if (!cancelled) setStockReservado(0);
      }
    };

    cargarStockReservado();

    return () => {
      cancelled = true;
    };
  }, [isOpen, producto?.id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();

    if (!formData.nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    if (!formData.categoria_id) {
      toast.error('La categoría es obligatoria');
      return;
    }
    if (formData.stock_actual === '' || isNaN(formData.stock_actual)) {
      toast.error('El stock debe ser un número válido');
      return;
    }

    const stockNum = parseFloat(formData.stock_actual);
    if (stockReservado > 0 && stockNum < stockReservado) {
      const ok = window.confirm(
        `El nuevo stock (${stockNum}) es menor que el reservado (${stockReservado}). ¿Continuar?`
      );
      if (!ok) return;
    }

    setLoading(true);
    try {
      const response = await axiosAuth.put(`/productos/actualizar-producto-basico/${producto.id}`, {
        ...formData,
        stock_actual: stockNum
      });
      if (response.data.success) {
        toast.success('Producto actualizado correctamente');
        onProductoActualizado();
        onClose();
      }
    } catch (error) {
      console.error('Error actualizando producto:', error);
      toast.error(error.response?.data?.message || 'Error al actualizar producto');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const stockActualNum = parseFloat(formData.stock_actual) || 0;
  const libre = Math.max(0, stockActualNum - stockReservado);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Editar Producto: {producto?.nombre}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            disabled={loading}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
            <select
              name="categoria_id"
              value={formData.categoria_id}
              onChange={handleInputChange}
              className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={loading}
            >
              <option value="">Seleccionar categoría</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nombre}
                </option>
              ))}
            </select>
          </div>

          {stockReservado > 0 && (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              <p className="font-semibold">Atención: stock reservado en pedidos activos</p>
              <p className="mt-1">
                Reservado: {stockReservado} unid. · Stock libre estimado: {libre} unid.
              </p>
              <p className="mt-1 text-xs text-amber-800">
                Ajustar el stock por debajo de {stockReservado} unid. podría afectar pedidos en curso.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Actual *</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const newValue = Math.max(0, parseFloat(formData.stock_actual || 0) - 0.5);
                  setFormData((prev) => ({ ...prev, stock_actual: newValue.toString() }));
                }}
                className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-gray-300"
                disabled={loading || parseFloat(formData.stock_actual || 0) <= 0}
              >
                -0.5
              </button>
              <input
                type="number"
                name="stock_actual"
                value={formData.stock_actual}
                onChange={handleInputChange}
                className="flex-1 p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                min="0"
                step="0.5"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => {
                  const newValue = parseFloat(formData.stock_actual || 0) + 0.5;
                  setFormData((prev) => ({ ...prev, stock_actual: newValue.toString() }));
                }}
                className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-300"
                disabled={loading}
              >
                +0.5
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-6 py-2 text-white rounded-md ${
                loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
              disabled={loading}
            >
              {loading ? 'Actualizando...' : 'Actualizar Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
