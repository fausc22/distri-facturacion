import { useEffect, useState } from 'react';
import { MdExpandLess, MdExpandMore, MdSearch } from 'react-icons/md';
import { roundFacturacion } from '../../utils/rounding';

const formatearMoneda = (monto) => `$${Number(monto || 0).toFixed(2)}`;

const formatearCantidad = (cantidad) => {
  const cantidadNum = parseFloat(cantidad);
  return cantidadNum % 1 === 0 ? cantidadNum.toString() : cantidadNum.toFixed(1);
};

const obtenerPorcentajeIva = (producto) => {
  const iva = Number(producto?.iva ?? producto?.porcentaje_iva ?? 21);
  return Number.isFinite(iva) && iva >= 0 ? iva : 21;
};

const calcularMontoConIva = (montoBase, porcentajeIva) =>
  roundFacturacion(Number(montoBase || 0) * (1 + porcentajeIva / 100));

function ControlCantidadCompacto({ cantidad, onCantidadChange, stockDisponible, disabled = false }) {
  const handleCantidadChange = (nuevaCantidad) => {
    let cantidadFloat = parseFloat(nuevaCantidad) || 0.5;
    cantidadFloat = Math.round(cantidadFloat * 2) / 2;
    const cantidadValida = Math.max(0.5, Math.min(stockDisponible, cantidadFloat));
    onCantidadChange(cantidadValida);
  };

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        disabled={disabled || cantidad <= 0.5}
        className="flex h-9 w-9 items-center justify-center rounded bg-gray-200 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-40"
        onClick={() => handleCantidadChange(cantidad - 0.5)}
      >
        −
      </button>
      <input
        type="number"
        value={cantidad}
        disabled={disabled}
        onChange={(e) => handleCantidadChange(e.target.value)}
        min="0.5"
        step="0.5"
        max={stockDisponible}
        inputMode="decimal"
        className="h-9 w-14 rounded border border-gray-300 text-center text-sm text-black"
        onBlur={(e) => {
          const valor = parseFloat(e.target.value);
          if (Number.isNaN(valor) || valor < 0.5) handleCantidadChange(0.5);
        }}
      />
      <button
        type="button"
        disabled={disabled || cantidad >= stockDisponible}
        className="flex h-9 w-9 items-center justify-center rounded bg-gray-200 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-40"
        onClick={() => handleCantidadChange(cantidad + 0.5)}
      >
        +
      </button>
    </div>
  );
}

function PanelDetalleExpandido({
  producto,
  cantidad,
  subtotal,
  mostrarPreciosConIva,
  mostrarCantidad,
  onCantidadChange,
  disabled = false,
}) {
  const porcentajeIva = obtenerPorcentajeIva(producto);
  const precioNeto = Number(producto.precio) || 0;
  const precioFinal = calcularMontoConIva(precioNeto, porcentajeIva);
  const subtotalNeto = Number(subtotal) || 0;
  const subtotalFinal = calcularMontoConIva(subtotalNeto, porcentajeIva);
  const stockInsuficiente = mostrarCantidad && cantidad > producto.stock_actual;

  return (
    <div className="mt-2 space-y-2 border-t border-gray-200 pt-2 text-xs text-gray-700">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className="text-gray-500">Código</span>
          <p className="font-medium text-black">{producto.id}</p>
        </div>
        <div>
          <span className="text-gray-500">UM</span>
          <p className="font-medium text-black">{producto.unidad_medida || '—'}</p>
        </div>
      </div>
      <div>
        <span className="text-gray-500">Neto</span>
        <p className="font-semibold text-black">{formatearMoneda(precioNeto)}</p>
        {mostrarPreciosConIva && (
          <p className="font-semibold text-green-700">
            Final c/IVA ({porcentajeIva}%): {formatearMoneda(precioFinal)}
          </p>
        )}
      </div>
      {mostrarCantidad && (
        <>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Cantidad</span>
            <ControlCantidadCompacto
              cantidad={cantidad}
              onCantidadChange={onCantidadChange}
              stockDisponible={producto.stock_actual}
              disabled={disabled}
            />
          </div>
          {stockInsuficiente && (
            <p className="text-red-600">Stock insuficiente (máx. {formatearCantidad(producto.stock_actual)})</p>
          )}
          <div className="rounded border border-green-200 bg-green-50 p-2">
            <span className="text-gray-500">Subtotal sin IVA</span>
            <p className="font-semibold text-black">{formatearMoneda(subtotalNeto)}</p>
            {mostrarPreciosConIva && (
              <p className="font-semibold text-green-700">Con IVA: {formatearMoneda(subtotalFinal)}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function ModalSeleccionProductos({
  resultados,
  productoSeleccionado,
  cantidad = 0.5,
  subtotal = 0,
  busqueda = '',
  onBusquedaChange,
  onBuscar,
  onSeleccionar,
  onDeseleccionar,
  onCantidadChange,
  onAgregar,
  onCerrar,
  loading = false,
  agregando = false,
  mostrarPreciosConIva = true,
  mostrarCantidad = true,
  mostrarBusqueda = true,
  titulo = 'Seleccionar Producto',
  textoAgregar,
  badgeHeader = null,
  isProductoDeshabilitado = () => false,
  getProductoDeshabilitadoLabel = () => '',
  mensajeSinResultados = 'No se encontraron resultados.',
  zIndex = 50,
  expandirDetalleAlSeleccionar = false,
}) {
  const [detalleExpandido, setDetalleExpandido] = useState(false);

  useEffect(() => {
    if (productoSeleccionado?.id) {
      setDetalleExpandido(Boolean(expandirDetalleAlSeleccionar));
      return;
    }
    setDetalleExpandido(false);
  }, [productoSeleccionado?.id, expandirDetalleAlSeleccionar]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const stockDisponible = Number(productoSeleccionado?.stock_actual) || 0;
  const stockInsuficiente = mostrarCantidad && cantidad > stockDisponible;
  const sinStock = stockDisponible <= 0;
  const agregarDeshabilitado =
    agregando || !productoSeleccionado || sinStock || stockInsuficiente;

  const handleSeleccionar = (producto) => {
    if (agregando || isProductoDeshabilitado(producto)) return;
    onSeleccionar(producto);
  };

  const labelAgregar =
    textoAgregar ||
    (productoSeleccionado
      ? sinStock
        ? 'Sin stock'
        : `Agregar ${formatearCantidad(cantidad)}`
      : 'Agregar');

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50 sm:p-4"
      style={{ zIndex }}
    >
      <div className="flex h-[100dvh] w-screen flex-col bg-white sm:h-auto sm:max-h-[90vh] sm:w-full sm:max-w-md sm:rounded-lg">
        <div className="flex shrink-0 items-center justify-between border-b px-3 py-2.5 sm:px-4">
          <h3 className="text-base font-semibold text-black sm:text-lg">{titulo}</h3>
          <div className="flex items-center gap-2">
            {badgeHeader}
            <button
              type="button"
              onClick={onCerrar}
              disabled={agregando}
              className="flex h-9 w-9 items-center justify-center rounded text-xl text-gray-500 hover:bg-gray-100 disabled:opacity-50"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
        </div>

        {mostrarBusqueda && (
          <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2 sm:px-4">
            <input
              type="text"
              className="min-h-[40px] flex-1 rounded border border-gray-300 px-3 text-sm text-black"
              placeholder="Buscar producto..."
              value={busqueda}
              onChange={(e) => onBusquedaChange?.(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onBuscar?.()}
              disabled={agregando}
              autoCapitalize="none"
              autoCorrect="off"
            />
            <button
              type="button"
              onClick={onBuscar}
              disabled={loading || agregando}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-emerald-600 text-white disabled:opacity-50"
              aria-label="Buscar"
            >
              <MdSearch size={22} />
            </button>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-1 py-1 [-webkit-overflow-scrolling:touch]">
          <ul>
            {loading ? (
              <li className="py-6 text-center text-sm text-gray-500">Buscando...</li>
            ) : resultados.length > 0 ? (
              resultados.map((producto, idx) => {
                const deshabilitado = isProductoDeshabilitado(producto);
                const isSelected = productoSeleccionado?.id === producto.id;
                const extraLabel = deshabilitado ? getProductoDeshabilitadoLabel(producto) : '';

                return (
                  <li key={producto.id ?? idx} className="border-b last:border-0">
                    <div
                      role="button"
                      tabIndex={deshabilitado || agregando ? -1 : 0}
                      className={`p-2.5 text-black transition-colors sm:p-3 ${
                        deshabilitado || agregando
                          ? 'cursor-not-allowed bg-red-50/60 opacity-60'
                          : producto.stock_actual > 0
                            ? 'cursor-pointer hover:bg-gray-50 active:bg-gray-100'
                            : 'cursor-pointer bg-red-50 text-red-700'
                      } ${isSelected ? 'bg-primary/10 ring-2 ring-inset ring-primary/40' : ''}`}
                      onClick={() => handleSeleccionar(producto)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSeleccionar(producto)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium leading-snug">
                            {producto.nombre}
                            {extraLabel && (
                              <span className="ml-1 text-xs text-red-600">{extraLabel}</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-600 sm:text-sm">
                            Neto: {formatearMoneda(producto.precio)}
                            {mostrarPreciosConIva && (
                              <>
                                {' '}
                                · Final:{' '}
                                {formatearMoneda(
                                  calcularMontoConIva(producto.precio, obtenerPorcentajeIva(producto))
                                )}
                              </>
                            )}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 text-xs sm:text-sm ${
                            producto.stock_actual > 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {formatearCantidad(producto.stock_actual)}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })
            ) : (
              <li className="py-6 text-center text-sm text-gray-500">{mensajeSinResultados}</li>
            )}
          </ul>
        </div>

        {productoSeleccionado && (
          <div className="shrink-0 border-t bg-gray-50 px-3 py-2">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-black">
                  {productoSeleccionado.nombre}
                </p>
                <p className="text-xs text-gray-600">
                  Stock {formatearCantidad(stockDisponible)} ·{' '}
                  {formatearMoneda(productoSeleccionado.precio)}
                  {mostrarPreciosConIva && (
                    <>
                      {' '}
                      · Final{' '}
                      {formatearMoneda(
                        calcularMontoConIva(
                          productoSeleccionado.precio,
                          obtenerPorcentajeIva(productoSeleccionado)
                        )
                      )}
                    </>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={onDeseleccionar}
                disabled={agregando}
                className="shrink-0 rounded px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50"
              >
                Cambiar
              </button>
              <button
                type="button"
                onClick={() => setDetalleExpandido((v) => !v)}
                className="shrink-0 rounded p-1 text-gray-500 hover:bg-gray-200"
                aria-label={detalleExpandido ? 'Ocultar detalle' : 'Ver detalle'}
              >
                {detalleExpandido ? <MdExpandLess size={20} /> : <MdExpandMore size={20} />}
              </button>
            </div>
            {detalleExpandido && (
              <PanelDetalleExpandido
                producto={productoSeleccionado}
                cantidad={cantidad}
                subtotal={subtotal}
                mostrarPreciosConIva={mostrarPreciosConIva}
                mostrarCantidad={mostrarCantidad}
                onCantidadChange={onCantidadChange}
                disabled={agregando}
              />
            )}
          </div>
        )}

        <div
          className="shrink-0 border-t bg-white px-3 py-2"
          style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
        >
          {productoSeleccionado && mostrarCantidad && (
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-gray-600">Cantidad</span>
              <ControlCantidadCompacto
                cantidad={cantidad}
                onCantidadChange={onCantidadChange}
                stockDisponible={stockDisponible}
                disabled={agregando}
              />
            </div>
          )}

          <div className="flex gap-2">
            {productoSeleccionado && (
              <button
                type="button"
                onClick={onAgregar}
                disabled={agregarDeshabilitado}
                className={`flex h-10 min-w-0 flex-1 items-center justify-center rounded-lg px-3 text-sm font-semibold text-white ${
                  agregarDeshabilitado
                    ? 'cursor-not-allowed bg-gray-400'
                    : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
                }`}
              >
                {agregando ? 'Agregando...' : labelAgregar}
              </button>
            )}
            <button
              type="button"
              onClick={onCerrar}
              disabled={agregando}
              className={`flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 ${
                productoSeleccionado ? 'shrink-0' : 'flex-1'
              }`}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
