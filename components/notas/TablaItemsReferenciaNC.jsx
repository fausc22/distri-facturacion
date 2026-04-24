// components/notas/TablaItemsReferenciaNC.jsx
// Grilla de ítems de la venta de referencia para Nota de Crédito:
// muestra producto, precio facturado, cantidad facturada y cantidad a anular.

import { useMemo } from 'react';
import { roundFacturacion } from '../../utils/rounding';
import { formatearMoneda } from '../../utils/formatearMoneda';

function ControlCantidad({ cantidad, max, onChange }) {
  const num = parseFloat(cantidad) || 0;
  const maxNum = parseFloat(max) || 0;

  const incrementar = () => {
    const nueva = Math.min(maxNum, num + 1);
    onChange(nueva);
  };

  const decrementar = () => {
    const nueva = Math.max(0, num - 1);
    onChange(nueva);
  };

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={decrementar}
        disabled={num <= 0}
        className="w-8 h-8 rounded border border-gray-300 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-gray-700"
        aria-label="Menos"
      >
        −
      </button>
      <input
        type="number"
        min={0}
        max={maxNum}
        step={1}
        value={num}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (!Number.isNaN(v)) onChange(Math.max(0, Math.min(maxNum, v)));
        }}
        className="w-14 text-center border border-gray-300 rounded py-1 text-sm"
      />
      <button
        type="button"
        onClick={incrementar}
        disabled={num >= maxNum}
        className="w-8 h-8 rounded border border-gray-300 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-gray-700"
        aria-label="Más"
      >
        +
      </button>
    </div>
  );
}

export function TablaItemsReferenciaNC({
  items = [],
  cantidadAAnular = {},
  onCantidadAAnularChange,
  onAnularTodo,
  onLimpiar,
  esClienteExento = false
}) {
  const { lineasConTotales, subtotalNC, totalIvaNC, totalNC } = useMemo(() => {
    let st = 0;
    let iva = 0;
    const lineas = items.map((item, index) => {
      const cantFacturada = parseFloat(item.cantidad) || 0;
      const precio = parseFloat(item.precio) || 0;
      const ivaLinea = parseFloat(item.iva) || 0;
      const subtotalLinea = parseFloat(item.subtotal) || 0;
      const cantAAnular = cantidadAAnular[index] ?? 0;
      const subtotalAnular = precio * cantAAnular;
      const ivaAnular = cantFacturada > 0 && subtotalLinea > 0
        ? (ivaLinea * cantAAnular) / cantFacturada
        : 0;
      st += subtotalAnular;
      iva += ivaAnular;
      return {
        ...item,
        index,
        cantFacturada,
        precio,
        cantAAnular,
        subtotalAnular,
        ivaAnular
      };
    });
    const total = roundFacturacion(st + iva);
    return {
      lineasConTotales: lineas,
      subtotalNC: roundFacturacion(st),
      totalIvaNC: roundFacturacion(iva),
      totalNC: total
    };
  }, [items, cantidadAAnular, esClienteExento]);

  const hayAlgunConCantidad = lineasConTotales.some((l) => (l.cantAAnular ?? 0) > 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
          Precios tomados de la venta de referencia
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onAnularTodo}
            className="text-sm px-3 py-1.5 rounded border border-blue-600 text-blue-700 hover:bg-blue-50"
          >
            Anular todo
          </button>
          <button
            type="button"
            onClick={onLimpiar}
            className="text-sm px-3 py-1.5 rounded border border-gray-400 text-gray-700 hover:bg-gray-100"
          >
            Limpiar
          </button>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-3 font-semibold text-gray-800">Producto</th>
                <th className="p-3 font-semibold text-gray-800 text-right">Precio facturado</th>
                <th className="p-3 font-semibold text-gray-800 text-center">Cant. facturada</th>
                <th className="p-3 font-semibold text-gray-800 text-center">Cant. a anular</th>
                <th className="p-3 font-semibold text-gray-800 text-right">Subtotal NC</th>
              </tr>
            </thead>
            <tbody>
              {lineasConTotales.map((linea) => (
                <tr key={linea.id ?? linea.index} className="border-t border-gray-100 hover:bg-gray-50/50">
                  <td className="p-3 text-gray-800">{linea.producto_nombre}</td>
                  <td className="p-3 text-right text-gray-700">{formatearMoneda(linea.precio)}</td>
                  <td className="p-3 text-center text-gray-700">{linea.cantFacturada}</td>
                  <td className="p-3">
                    <div className="flex justify-center">
                      <ControlCantidad
                        cantidad={linea.cantAAnular ?? 0}
                        max={linea.cantFacturada}
                        onChange={(v) => onCantidadAAnularChange(linea.index, v)}
                      />
                    </div>
                  </td>
                  <td className="p-3 text-right font-medium text-gray-800">
                    {linea.cantAAnular > 0 ? formatearMoneda(linea.subtotalAnular) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {hayAlgunConCantidad && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex flex-wrap gap-4 justify-end text-sm">
            <span className="text-gray-600">Subtotal NC: <strong className="text-gray-800">{formatearMoneda(subtotalNC)}</strong></span>
            {!esClienteExento && (
              <span className="text-gray-600">IVA: <strong className="text-gray-800">{formatearMoneda(totalIvaNC)}</strong></span>
            )}
            <span className="text-gray-800 font-semibold">Total NC: {formatearMoneda(totalNC)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default TablaItemsReferenciaNC;
