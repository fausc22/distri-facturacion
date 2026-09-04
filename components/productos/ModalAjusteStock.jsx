import React, { useState, useEffect } from 'react';
import ModalBase from '../common/ModalBase';
import { axiosAuth } from '../../utils/apiClient';
import { toast } from 'react-hot-toast';
import { formatearCantidad } from '../../utils/formatearCantidad';

const MOTIVOS = [
  'Corrección de inventario',
  'Merma',
  'Robo/pérdida',
  'Otro'
];

function ModalAjusteStock({
  producto,
  isOpen,
  onClose,
  onStockAjustado
}) {
  const [nuevoStock, setNuevoStock] = useState('');
  const [motivo, setMotivo] = useState(MOTIVOS[0]);
  const [observaciones, setObservaciones] = useState('');
  const [stockReservado, setStockReservado] = useState(0);
  const [loading, setLoading] = useState(false);

  const stockActual = parseFloat(producto?.stock_actual) || 0;

  useEffect(() => {
    if (!isOpen || !producto) return;
    setNuevoStock(String(producto.stock_actual ?? '0'));
    setMotivo(MOTIVOS[0]);
    setObservaciones('');
  }, [isOpen, producto]);

  useEffect(() => {
    if (!isOpen || !producto?.id) {
      setStockReservado(0);
      return;
    }

    let cancelled = false;
    const cargar = async () => {
      try {
        const response = await axiosAuth.get(`/productos/stock-reservado/${producto.id}`);
        if (!cancelled && response.data.success) {
          setStockReservado(parseFloat(response.data.data.reservado) || 0);
        }
      } catch {
        if (!cancelled) setStockReservado(0);
      }
    };
    cargar();
    return () => { cancelled = true; };
  }, [isOpen, producto?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const stockNum = parseFloat(nuevoStock);
    if (isNaN(stockNum) || stockNum < 0) {
      toast.error('El stock debe ser un número válido mayor o igual a 0');
      return;
    }
    if (!motivo) {
      toast.error('El motivo del ajuste es obligatorio');
      return;
    }
    if (stockNum === stockActual) {
      toast.error('El nuevo stock es igual al actual');
      return;
    }
    if (stockReservado > 0 && stockNum < stockReservado) {
      const ok = window.confirm(
        `El nuevo stock (${formatearCantidad(stockNum)}) es menor que el reservado (${formatearCantidad(stockReservado)}). ¿Continuar?`
      );
      if (!ok) return;
    }

    const motivoFinal = motivo === 'Otro' && observaciones.trim()
      ? `Otro: ${observaciones.trim()}`
      : motivo;

    setLoading(true);
    try {
      const response = await axiosAuth.put(`/productos/actualizar-producto-basico/${producto.id}`, {
        nombre: producto.nombre,
        categoria_id: producto.categoria_id,
        stock_actual: stockNum,
        motivo_ajuste: motivoFinal
      });
      if (response.data.success) {
        toast.success('Stock ajustado correctamente');
        onStockAjustado?.();
        onClose();
      } else {
        toast.error(response.data.message || 'No se pudo ajustar el stock');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al ajustar el stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title={`Ajustar stock: ${producto?.nombre || ''}`}
      loading={loading}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock actual</label>
            <input
              type="text"
              value={formatearCantidad(stockActual)}
              readOnly
              className="w-full min-h-[44px] px-3 py-2.5 border border-gray-200 rounded-md bg-gray-50 text-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nuevo stock *</label>
            <input
              type="number"
              value={nuevoStock}
              onChange={(e) => setNuevoStock(e.target.value)}
              step="0.5"
              min="0"
              required
              disabled={loading}
              className="w-full min-h-[44px] px-3 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {stockReservado > 0 && (
          <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-semibold">Stock reservado en pedidos activos</p>
            <p className="mt-1">
              Reservado: {formatearCantidad(stockReservado)} · Libre estimado:{' '}
              {formatearCantidad(Math.max(0, (parseFloat(nuevoStock) || 0) - stockReservado))}
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Motivo del ajuste *</label>
          <select
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            required
            disabled={loading}
            className="w-full min-h-[44px] px-3 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            {MOTIVOS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {motivo === 'Otro' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Detalle</label>
            <input
              type="text"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              disabled={loading}
              placeholder="Describí el motivo..."
              className="w-full min-h-[44px] px-3 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="min-h-[44px] px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`min-h-[44px] px-6 py-2 text-white rounded-md ${
              loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Guardando...' : 'Confirmar ajuste'}
          </button>
        </div>
      </form>
    </ModalBase>
  );
}

export default React.memo(ModalAjusteStock);
