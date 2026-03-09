// components/ventas/TablaVentas.jsx - Fase 4: handlers por delegación; Fase 5: React.memo
import React, { useState, useMemo, useCallback } from 'react';

const formatearFecha = (fecha) => {
  if (!fecha) return 'Fecha no disponible';
  
  return new Date(fecha).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

// ✅ FUNCIÓN: Desglosar numero_factura (maneja facturas y notas)
const desglosarNumeroFactura = (numeroCompleto, tipoDoc) => {
  if (!numeroCompleto || typeof numeroCompleto !== 'string') {
    return {
      tipoFactura: '-',
      puntoVenta: '-',
      numeroComprobante: '-',
      numeroCompleto: '-',
      esNota: false
    };
  }

  const esNota = tipoDoc === 'NOTA_DEBITO' || tipoDoc === 'NOTA_CREDITO';
  
  if (esNota) {
    // ✅ Formato de nota: "0004-00001" (sin letra al inicio, 5 dígitos)
    const regexNota = /^(\d{4})-(\d{5})$/;
    const matchNota = numeroCompleto.trim().match(regexNota);
    
    if (matchNota) {
      return {
        tipoFactura: tipoDoc === 'NOTA_DEBITO' ? 'ND' : 'NC',
        puntoVenta: matchNota[1],
        numeroComprobante: matchNota[2],
        numeroCompleto: numeroCompleto,
        esNota: true
      };
    } else {
      // Si no coincide con el formato esperado, mostrar tal cual
      return {
        tipoFactura: tipoDoc === 'NOTA_DEBITO' ? 'ND' : 'NC',
        puntoVenta: '-',
        numeroComprobante: '-',
        numeroCompleto: numeroCompleto,
        esNota: true
      };
    }
  } else {
    // ✅ Formato de factura: "A 0004-00000001" (con letra al inicio, 8 dígitos)
    const regexFactura = /^([A-Z]+)\s+(\d{4})-(\d{8})$/;
    const matchFactura = numeroCompleto.trim().match(regexFactura);

    if (!matchFactura) {
      return {
        tipoFactura: '-',
        puntoVenta: '-',
        numeroComprobante: '-',
        numeroCompleto: numeroCompleto,
        esNota: false
      };
    }

    return {
      tipoFactura: matchFactura[1],
      puntoVenta: matchFactura[2],
      numeroComprobante: matchFactura[3],
      numeroCompleto: numeroCompleto,
      esNota: false
    };
  }
};

// Componente para tabla en escritorio (Fase 4: delegación de eventos en tbody)
function TablaEscritorio({
  ventas,
  selectedVentas,
  onSelectAll,
  onSort,
  onTbodyClick,
  onTbodyDoubleClick,
  onCheckboxNoop,
  sortField,
  sortDirection
}) {
  const getSortIcon = (field) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const getDocumentoStyle = (tipoDoc) => {
    switch (tipoDoc) {
      case 'FACTURA':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'NOTA_DEBITO':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'NOTA_CREDITO':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTipoFiscalStyle = (tipoF) => {
    switch (tipoF) {
      case 'A':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'B':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'C':
      case 'X':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="hidden lg:block overflow-x-auto bg-white rounded-lg shadow">
      <table className="w-full">
        <thead className="bg-gray-200">
          <tr>
            <th className="p-3 text-center">
              <input
                type="checkbox"
                checked={selectedVentas.length === ventas.length && ventas.length > 0}
                onChange={onSelectAll}
                className="w-4 h-4"
                aria-label="Seleccionar todas"
              />
            </th>
            <th 
              className="p-3 text-left cursor-pointer hover:bg-gray-300 transition-colors"
              onClick={() => onSort('fecha')}
            >
              Fecha {getSortIcon('fecha')}
            </th>
            <th 
              className="p-3 text-left cursor-pointer hover:bg-gray-300 transition-colors"
              onClick={() => onSort('cliente_nombre')}
            >
              Cliente {getSortIcon('cliente_nombre')}
            </th>
            <th 
              className="p-3 text-center cursor-pointer hover:bg-gray-300 transition-colors"
              onClick={() => onSort('numero_factura')}
            >
              Número Factura {getSortIcon('numero_factura')}
            </th>
            <th className="p-3 text-center">Documento</th>
            <th className="p-3 text-center">Tipo Fiscal</th>
            <th 
              className="p-3 text-right cursor-pointer hover:bg-gray-300 transition-colors"
              onClick={() => onSort('total')}
            >
              Total {getSortIcon('total')}
            </th>
            <th className="p-3 text-center">Estado CAE</th>
            <th 
              className="p-3 text-left cursor-pointer hover:bg-gray-300 transition-colors"
              onClick={() => onSort('empleado_nombre')}
            >
              Vendedor {getSortIcon('empleado_nombre')}
            </th>
          </tr>
        </thead>
        <tbody onClick={onTbodyClick} onDoubleClick={onTbodyDoubleClick}>
          {ventas.map((venta) => {
            const numeroFacturaDesglosado = desglosarNumeroFactura(venta.numero_factura, venta.tipo_doc);
            
            return (
              <tr
                key={venta.id}
                data-venta-id={venta.id}
                className={`border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                  selectedVentas.includes(venta.id) ? 'bg-blue-50' : ''
                }`}
              >
                <td className="p-3 text-center">
                  <input
                    type="checkbox"
                    checked={selectedVentas.includes(venta.id)}
                    onChange={onCheckboxNoop}
                    tabIndex={0}
                    className="w-4 h-4"
                    aria-label={`Seleccionar venta ${venta.id}`}
                  />
                </td>
                {/* FECHA */}
                <td className="p-3 text-sm">
                  {formatearFecha(venta.fecha)}
                </td>
                {/* CLIENTE */}
                <td className="p-3 font-medium">
                  <div>
                    <div className="font-semibold">{venta.cliente_nombre || 'Cliente no especificado'}</div>
                    {venta.cliente_ciudad && (
                      <div className="text-xs text-gray-500">{venta.cliente_ciudad}</div>
                    )}
                  </div>
                </td>
                {/* ✅ NUMERO_FACTURA */}
                <td className="p-3 text-center">
                  {numeroFacturaDesglosado.numeroCompleto !== '-' ? (
                    <div className="font-mono text-sm">
                      {numeroFacturaDesglosado.esNota ? (
                        // ✅ Formato para NOTAS: "0004-00001"
                        <div className="font-bold text-purple-600">
                          {numeroFacturaDesglosado.numeroCompleto}
                        </div>
                      ) : (
                        // ✅ Formato para FACTURAS: "A" arriba, "0004-00000001" abajo
                        <>
                          <div className="font-bold text-blue-600">
                            {numeroFacturaDesglosado.tipoFactura}
                          </div>
                          <div className="text-xs text-gray-600">
                            {numeroFacturaDesglosado.puntoVenta}-{numeroFacturaDesglosado.numeroComprobante}
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">Sin número</span>
                  )}
                </td>
                {/* DOCUMENTO */}
                <td className="p-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getDocumentoStyle(venta.tipo_doc)}`}>
                    {venta.tipo_doc || 'N/A'}
                  </span>
                </td>
                {/* TIPO FISCAL */}
                <td className="p-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTipoFiscalStyle(venta.tipo_f)}`}>
                    {venta.tipo_f || 'N/A'}
                  </span>
                </td>
                {/* TOTAL */}
                <td className="p-3 text-right">
                  <div className="font-semibold text-green-600">
                    ${Number(venta.total || 0).toFixed(2)}
                  </div>
                  {venta.subtotal && (
                    <div className="text-xs text-gray-500">
                      Subtotal: ${Number(venta.subtotal || 0).toFixed(2)}
                    </div>
                  )}
                </td>
                {/* ESTADO CAE */}
                <td className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {venta.cae_id ? (
                      <>
                        <span className="text-green-600 text-lg">✅</span>
                        <span className="text-xs text-green-600 font-medium">Aprobado</span>
                      </>
                    ) : (
                      <>
                        <span className="text-red-600 text-lg">❌</span>
                        <span className="text-xs text-red-600 font-medium">Pendiente</span>
                      </>
                    )}
                  </div>
                </td>
                {/* VENDEDOR */}
                <td className="p-3">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                    {venta.empleado_nombre || 'No especificado'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Componente para tarjetas en móvil (Fase 4: touch targets y scroll)
function TarjetasMovil({
  ventas,
  selectedVentas,
  onSelectAll,
  onCardAreaClick,
  onCheckboxNoop
}) {
  const getCAEIcon = (caeId) => (caeId ? '✅' : '❌');

  return (
    <div className="lg:hidden">
      <div className="bg-gray-100 p-3 rounded-t-lg flex items-center justify-between mb-4">
        <label className="flex items-center gap-2 cursor-pointer min-h-[44px] min-w-[44px] py-2 -my-2 px-1 -mx-1 flex-1 touch-manipulation">
          <input
            type="checkbox"
            checked={selectedVentas.length === ventas.length && ventas.length > 0}
            onChange={onSelectAll}
            className="w-4 h-4 shrink-0"
            aria-label="Seleccionar todas"
          />
          <span className="text-sm font-medium text-gray-700">
            Seleccionar todos ({ventas.length})
          </span>
        </label>
        {selectedVentas.length > 0 && (
          <span className="text-sm font-medium text-blue-600 shrink-0">
            {selectedVentas.length} seleccionados
          </span>
        )}
      </div>

      <div className="space-y-3" onClick={onCardAreaClick}>
        {ventas.map((venta) => {
          const numeroFacturaDesglosado = desglosarNumeroFactura(venta.numero_factura, venta.tipo_doc);
          
          return (
            <div
              key={venta.id}
              data-venta-id={venta.id}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  const fakeCard = { getAttribute: (attr) => (attr === 'data-venta-id' ? String(venta.id) : null) };
                  onCardAreaClick({ target: { closest: () => fakeCard, type: '' } });
                }
              }}
              aria-label={`Venta ${venta.numero_factura || venta.id}, toca para ver detalles`}
              className={`bg-white rounded-lg border-2 p-4 transition-all duration-200 cursor-pointer touch-manipulation active:scale-[0.99] ${
                selectedVentas.includes(venta.id) 
                  ? 'border-blue-300 bg-blue-50 shadow-md' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <label className="flex items-center justify-center min-h-[44px] min-w-[44px] py-2 -my-2 px-1 -mx-1 cursor-pointer touch-manipulation shrink-0">
                    <input
                      type="checkbox"
                      checked={selectedVentas.includes(venta.id)}
                      onChange={onCheckboxNoop}
                      className="w-4 h-4"
                      aria-label={`Seleccionar venta ${venta.id}`}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </label>
                  <div>
                    {/* ✅ NUMERO_FACTURA en lugar de ID */}
                    {numeroFacturaDesglosado.numeroCompleto !== '-' ? (
                      <div className={`font-mono text-sm font-bold ${numeroFacturaDesglosado.esNota ? 'text-purple-600' : 'text-blue-600'}`}>
                        {numeroFacturaDesglosado.numeroCompleto}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400">Sin número de factura</div>
                    )}
                    <p className="text-xs text-gray-500">
                      {formatearFecha(venta.fecha)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <span className="text-lg">{getCAEIcon(venta.cae_id)}</span>
                  <span className={`text-xs font-medium ${
                    venta.cae_id ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {venta.cae_id ? 'CAE' : 'Pendiente'}
                  </span>
                </div>
              </div>

              {/* Cliente */}
              <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800">
                  👤 {venta.cliente_nombre || 'Cliente no especificado'}
                </h4>
                {venta.cliente_ciudad && (
                  <p className="text-sm text-gray-600">
                    📍 {venta.cliente_ciudad}
                  </p>
                )}
              </div>

              {/* Total y Vendedor */}
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="text-center p-2 bg-green-50 rounded">
                  <div className="text-lg font-bold text-green-600">
                    ${Number(venta.total || 0).toFixed(2)}
                  </div>
                  <div className="text-xs text-green-800">Total</div>
                </div>
                <div className="text-center p-2 bg-blue-50 rounded">
                  <div className="text-sm font-bold text-blue-600 truncate">
                    {venta.empleado_nombre || 'No especificado'}
                  </div>
                  <div className="text-xs text-blue-800">Vendedor</div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-3 pt-3 border-t border-gray-200 text-center">
                <p className="text-xs text-gray-500">
                  💡 Toca para ver detalles
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TablaVentas({
  ventas,
  selectedVentas,
  onSelectVenta,
  onSelectAll,
  onRowDoubleClick,
  loading
}) {
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Fase 3: memoizar ordenamiento para no recalcular en cada render
  const sortedVentas = useMemo(() => {
    return [...ventas].sort((a, b) => {
      if (!sortField) return 0;

      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === 'total') {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      }

      if (sortField === 'fecha') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [ventas, sortField, sortDirection]);

  const noop = useCallback(() => {}, []);

  // Fase 4: un solo handler en tbody (escritorio) en lugar de uno por fila
  const handleTbodyClick = useCallback((e) => {
    if (e.target.type === 'checkbox') {
      const row = e.target.closest('tr[data-venta-id]');
      if (row) onSelectVenta(Number(row.getAttribute('data-venta-id')));
      e.preventDefault();
    }
  }, [onSelectVenta]);

  const handleTbodyDoubleClick = useCallback((e) => {
    const row = e.target.closest('tr[data-venta-id]');
    if (!row) return;
    const id = Number(row.getAttribute('data-venta-id'));
    const venta = sortedVentas.find((v) => v.id === id);
    if (venta) onRowDoubleClick(venta);
  }, [onRowDoubleClick, sortedVentas]);

  // Fase 4: un solo handler en el contenedor de tarjetas (móvil)
  const handleCardAreaClick = useCallback((e) => {
    const card = e.target.closest('[data-venta-id]');
    if (!card) return;
    const id = Number(card.getAttribute('data-venta-id'));
    if (e.target.type === 'checkbox' || e.target.closest('input[type=checkbox]')) {
      onSelectVenta(id);
      e.preventDefault();
      return;
    }
    const venta = sortedVentas.find((v) => v.id === id);
    if (venta) onRowDoubleClick(venta);
  }, [onSelectVenta, onRowDoubleClick, sortedVentas]);

  // Fase 3: memoizar monto total del pie de tabla
  const montoTotal = useMemo(
    () => ventas.reduce((acc, v) => acc + Number(v.total || 0), 0),
    [ventas]
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-lg">Cargando ventas...</span>
      </div>
    );
  }

  if (ventas.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        <div className="text-4xl mb-4">📋</div>
        <div className="text-lg font-medium mb-2">No hay ventas registradas</div>
        <div className="text-sm">Las ventas aparecerán aquí cuando se registren</div>
      </div>
    );
  }

  return (
    <div>
      <TablaEscritorio
        ventas={sortedVentas}
        selectedVentas={selectedVentas}
        onSelectAll={onSelectAll}
        onTbodyClick={handleTbodyClick}
        onTbodyDoubleClick={handleTbodyDoubleClick}
        onCheckboxNoop={noop}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
      />

      <TarjetasMovil
        ventas={sortedVentas}
        selectedVentas={selectedVentas}
        onSelectAll={onSelectAll}
        onCardAreaClick={handleCardAreaClick}
        onCheckboxNoop={noop}
      />
      
      <div className="bg-gray-50 px-4 py-3 border-t rounded-b-lg mt-4">
        <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600 gap-2">
          <span>
            {selectedVentas.length > 0 && (
              <span className="font-medium text-blue-600">
                {selectedVentas.length} de {ventas.length} seleccionados
              </span>
            )}
          </span>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <span>
              Total de ventas: <span className="font-medium">{ventas.length}</span>
            </span>
            <span>
              Monto total: <span className="font-medium text-green-600">
                ${montoTotal.toFixed(2)}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(TablaVentas);