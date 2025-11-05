// components/ventas/TablaVentas.jsx
import { useState } from 'react';

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

// ✅ NUEVA FUNCIÓN: Desglosar numero_factura
const desglosarNumeroFactura = (numeroCompleto) => {
  if (!numeroCompleto || typeof numeroCompleto !== 'string') {
    return {
      tipoFactura: '-',
      puntoVenta: '-',
      numeroComprobante: '-',
      numeroCompleto: '-'
    };
  }

  const regex = /^([A-Z]+)\s+(\d{4})-(\d{8})$/;
  const match = numeroCompleto.trim().match(regex);

  if (!match) {
    return {
      tipoFactura: '-',
      puntoVenta: '-',
      numeroComprobante: '-',
      numeroCompleto: numeroCompleto
    };
  }

  return {
    tipoFactura: match[1],
    puntoVenta: match[2],
    numeroComprobante: match[3],
    numeroCompleto: numeroCompleto
  };
};

// Componente para tabla en escritorio
function TablaEscritorio({
  ventas,
  selectedVentas,
  onSelectVenta,
  onSelectAll,
  onRowDoubleClick,
  sortField,
  sortDirection,
  onSort
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
                onChange={() => onSelectAll()}
                className="w-4 h-4"
              />
            </th>
            {/* ✅ NUEVO ORDEN: FECHA, CLIENTE, NUMERO_FACTURA, DOCUMENTO, TIPO FISCAL, TOTAL, ESTADO CAE, VENDEDOR */}
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
            <th className="p-3 text-center">
              Documento
            </th>
            <th className="p-3 text-center">
              Tipo Fiscal
            </th>
            <th 
              className="p-3 text-right cursor-pointer hover:bg-gray-300 transition-colors"
              onClick={() => onSort('total')}
            >
              Total {getSortIcon('total')}
            </th>
            <th className="p-3 text-center">
              Estado CAE
            </th>
            <th 
              className="p-3 text-left cursor-pointer hover:bg-gray-300 transition-colors"
              onClick={() => onSort('empleado_nombre')}
            >
              Vendedor {getSortIcon('empleado_nombre')}
            </th>
          </tr>
        </thead>
        <tbody>
          {ventas.map((venta) => {
            const numeroFacturaDesglosado = desglosarNumeroFactura(venta.numero_factura);
            
            return (
              <tr
                key={venta.id}
                className={`border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                  selectedVentas.includes(venta.id) ? 'bg-blue-50' : ''
                }`}
                onDoubleClick={() => onRowDoubleClick(venta)}
              >
                <td className="p-3 text-center">
                  <input
                    type="checkbox"
                    checked={selectedVentas.includes(venta.id)}
                    onChange={() => onSelectVenta(venta.id)}
                    className="w-4 h-4"
                    onClick={(e) => e.stopPropagation()}
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
                      <div className="font-bold text-blue-600">
                        {numeroFacturaDesglosado.tipoFactura}
                      </div>
                      <div className="text-xs text-gray-600">
                        {numeroFacturaDesglosado.puntoVenta}-{numeroFacturaDesglosado.numeroComprobante}
                      </div>
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

// ✅ Componente para tarjetas en móvil - ACTUALIZADO
function TarjetasMovil({
  ventas,
  selectedVentas,
  onSelectVenta,
  onSelectAll,
  onRowDoubleClick
}) {
  // ... (mantener estilos)
  
  const getDocumentoIcon = (tipoDoc) => {
    switch (tipoDoc) {
      case 'FACTURA': return '📄';
      case 'NOTA_DEBITO': return '📝';
      case 'NOTA_CREDITO': return '📋';
      default: return '📄';
    }
  };

  const getCAEIcon = (caeId) => {
    return caeId ? '✅' : '❌';
  };

  return (
    <div className="lg:hidden">
      <div className="bg-gray-100 p-3 rounded-t-lg flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={selectedVentas.length === ventas.length && ventas.length > 0}
            onChange={() => onSelectAll()}
            className="w-4 h-4"
          />
          <span className="text-sm font-medium text-gray-700">
            Seleccionar todos ({ventas.length})
          </span>
        </div>
        {selectedVentas.length > 0 && (
          <span className="text-sm font-medium text-blue-600">
            {selectedVentas.length} seleccionados
          </span>
        )}
      </div>

      <div className="space-y-3">
        {ventas.map((venta) => {
          const numeroFacturaDesglosado = desglosarNumeroFactura(venta.numero_factura);
          
          return (
            <div
              key={venta.id}
              className={`bg-white rounded-lg border-2 p-4 transition-all duration-200 cursor-pointer ${
                selectedVentas.includes(venta.id) 
                  ? 'border-blue-300 bg-blue-50 shadow-md' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onRowDoubleClick(venta)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedVentas.includes(venta.id)}
                    onChange={() => onSelectVenta(venta.id)}
                    className="w-4 h-4 mt-1"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div>
                    {/* ✅ NUMERO_FACTURA en lugar de ID */}
                    {numeroFacturaDesglosado.numeroCompleto !== '-' ? (
                      <div className="font-mono text-sm font-bold text-blue-600">
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

// Componente principal (mantener igual, ya incluye TablaEscritorio y TarjetasMovil)
export default function TablaVentas({
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

  const sortedVentas = [...ventas].sort((a, b) => {
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
        onSelectVenta={onSelectVenta}
        onSelectAll={onSelectAll}
        onRowDoubleClick={onRowDoubleClick}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
      />

      <TarjetasMovil
        ventas={sortedVentas}
        selectedVentas={selectedVentas}
        onSelectVenta={onSelectVenta}
        onSelectAll={onSelectAll}
        onRowDoubleClick={onRowDoubleClick}
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
                ${ventas.reduce((acc, v) => acc + Number(v.total || 0), 0).toFixed(2)}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}