import { useState } from 'react';

// Función helper para formatear fechas
const formatearFecha = (fecha) => {
  if (!fecha) return 'Fecha no disponible';
  
  return new Date(fecha).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

// Componente para tabla en escritorio
function TablaEscritorio({
  registros,
  onRowDoubleClick,
  sortField,
  sortDirection,
  onSort
}) {
  const getSortIcon = (field) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const getEstadoStyle = (estado) => {
    switch (estado) {
      case 'EXITOSO':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'FALLIDO':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMetodoStyle = (metodo) => {
    switch (metodo) {
      case 'GET':
        return 'bg-blue-100 text-blue-800';
      case 'POST':
        return 'bg-green-100 text-green-800';
      case 'PUT':
        return 'bg-yellow-100 text-yellow-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      case 'PATCH':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="hidden lg:block overflow-x-auto bg-white rounded-lg shadow">
      <table className="w-full min-w-[800px]">
        <thead className="bg-gray-200">
          <tr>
            <th 
              className="p-2 text-left cursor-pointer hover:bg-gray-300 transition-colors w-36"
              onClick={() => onSort('fecha_hora')}
            >
              Fecha/Hora {getSortIcon('fecha_hora')}
            </th>
            <th 
              className="p-2 text-left cursor-pointer hover:bg-gray-300 transition-colors w-28"
              onClick={() => onSort('usuario_nombre')}
            >
              Usuario {getSortIcon('usuario_nombre')}
            </th>
            <th 
              className="p-2 text-left cursor-pointer hover:bg-gray-300 transition-colors w-32"
              onClick={() => onSort('accion')}
            >
              Acción {getSortIcon('accion')}
            </th>
            <th 
              className="p-2 text-left cursor-pointer hover:bg-gray-300 transition-colors w-24"
              onClick={() => onSort('tabla_afectada')}
            >
              Tabla {getSortIcon('tabla_afectada')}
            </th>
            <th 
              className="p-2 text-left cursor-pointer hover:bg-gray-300 transition-colors"
              onClick={() => onSort('endpoint')}
            >
              Endpoint {getSortIcon('endpoint')}
            </th>
            <th 
              className="p-2 text-center cursor-pointer hover:bg-gray-300 transition-colors w-20"
              onClick={() => onSort('metodo_http')}
            >
              Método {getSortIcon('metodo_http')}
            </th>
            <th 
              className="p-2 text-center cursor-pointer hover:bg-gray-300 transition-colors w-24"
              onClick={() => onSort('estado')}
            >
              Estado {getSortIcon('estado')}
            </th>
          </tr>
        </thead>
        <tbody>
          {registros.map((registro) => (
            <tr
              key={registro.id}
              className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
              onDoubleClick={() => onRowDoubleClick(registro)}
              title="Doble click para ver detalles"
            >
              <td className="p-2 text-sm truncate max-w-[120px]" title={formatearFecha(registro.fecha_hora)}>
                {formatearFecha(registro.fecha_hora)}
              </td>
              <td className="p-2 font-medium">
                <div className="max-w-[100px]">
                  <div className="font-semibold text-blue-600 truncate" title={registro.usuario_nombre || 'Sistema'}>
                    {registro.usuario_nombre || 'Sistema'}
                  </div>
                  {registro.usuario_id && (
                    <div className="text-xs text-gray-500 truncate">
                      ID: {registro.usuario_id}
                    </div>
                  )}
                </div>
              </td>
              <td className="p-2">
                <span className="font-medium text-gray-800 block truncate max-w-[120px]" title={registro.accion}>
                  {registro.accion}
                </span>
              </td>
              <td className="p-2">
                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm block truncate max-w-[80px]" title={registro.tabla_afectada || 'N/A'}>
                  {registro.tabla_afectada || 'N/A'}
                </span>
              </td>
              <td className="p-2 text-sm">
                <code className="bg-gray-100 px-2 py-1 rounded text-xs block truncate max-w-[200px]" title={registro.endpoint || 'N/A'}>
                  {registro.endpoint || 'N/A'}
                </code>
              </td>
              <td className="p-2 text-center">
                {registro.metodo_http && (
                  <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${getMetodoStyle(registro.metodo_http)}`}>
                    {registro.metodo_http}
                  </span>
                )}
              </td>
              <td className="p-2 text-center">
                <div className="flex justify-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${getEstadoStyle(registro.estado)}`}>
                    {registro.estado === 'EXITOSO' ? '✅ OK' : '❌ Error'}
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Componente para tarjetas en móvil
function TarjetasMovil({
  registros,
  onRowDoubleClick
}) {
  const getEstadoStyle = (estado) => {
    switch (estado) {
      case 'EXITOSO':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'FALLIDO':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getEstadoIcon = (estado) => {
    return estado === 'EXITOSO' ? '✅' : '❌';
  };

  const getMetodoStyle = (metodo) => {
    switch (metodo) {
      case 'GET': return 'bg-blue-100 text-blue-800';
      case 'POST': return 'bg-green-100 text-green-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      case 'PATCH': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="lg:hidden px-2">
      {registros.map((registro) => (
        <div
          key={registro.id}
          className="bg-white rounded-lg border p-3 mb-3 shadow-sm transition-all duration-200 cursor-pointer hover:shadow-md active:scale-[0.98]"
          onClick={() => onRowDoubleClick(registro)}
        >
          {/* Header compacto */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-blue-600 truncate">
                {registro.accion}
              </h3>
              <p className="text-xs text-gray-500 truncate">
                {formatearFecha(registro.fecha_hora)}
              </p>
            </div>
            
            <div className="flex items-center gap-1 ml-2 flex-shrink-0">
              <span className="text-sm">{getEstadoIcon(registro.estado)}</span>
              <span className={`px-1.5 py-0.5 rounded text-xs font-medium border ${getEstadoStyle(registro.estado)}`}>
                {registro.estado === 'EXITOSO' ? 'OK' : 'Error'}
              </span>
            </div>
          </div>

          {/* Usuario y tabla */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="min-w-0">
              <p className="text-xs text-gray-600 font-medium">👤 Usuario</p>
              <p className="text-sm font-semibold text-gray-800 truncate">
                {registro.usuario_nombre || 'Sistema'}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-600 font-medium">📋 Tabla</p>
              <p className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-800 truncate">
                {registro.tabla_afectada || 'N/A'}
              </p>
            </div>
          </div>

          {/* Método y endpoint */}
          <div className="space-y-1">
            {registro.metodo_http && (
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-bold ${getMetodoStyle(registro.metodo_http)}`}>
                  {registro.metodo_http}
                </span>
                <span className="text-xs text-gray-600 font-medium">Método HTTP</span>
              </div>
            )}
            
            {registro.endpoint && (
              <div>
                <p className="text-xs text-gray-600 font-medium mb-1">🔗 Endpoint</p>
                <code className="text-xs bg-gray-100 p-1 rounded block truncate text-gray-700">
                  {registro.endpoint}
                </code>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              💡 Toca para ver detalles completos
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// Componente principal
export default function TablaAuditoria({
  registros,
  onRowDoubleClick,
  loading
}) {
  const [sortField, setSortField] = useState('fecha_hora');
  const [sortDirection, setSortDirection] = useState('desc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc'); // Por defecto descendente para fechas
    }
  };

  const sortedRegistros = [...registros].sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    // Manejar campos nulos/undefined
    if (!aValue && !bValue) return 0;
    if (!aValue) return 1;
    if (!bValue) return -1;
    
    // Manejar fechas
    if (sortField === 'fecha_hora') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }
    
    // Manejar texto
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
        <span className="ml-3 text-lg">Cargando registros de auditoría...</span>
      </div>
    );
  }

  if (registros.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        <div className="text-4xl mb-4">📋</div>
        <div className="text-lg font-medium mb-2">No hay registros de auditoría</div>
        <div className="text-sm">Los registros aparecerán aquí cuando se generen</div>
      </div>
    );
  }

  return (
    <div>
      {/* Tabla para escritorio */}
      <TablaEscritorio
        registros={sortedRegistros}
        onRowDoubleClick={onRowDoubleClick}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
      />

      {/* Tarjetas para móvil */}
      <TarjetasMovil
        registros={sortedRegistros}
        onRowDoubleClick={onRowDoubleClick}
      />
      
      {/* Footer con estadísticas */}
      <div className="bg-gray-50 px-4 py-3 border-t rounded-b-lg mt-4">
        <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600 gap-2">
          <span>
            Total de registros: <span className="font-medium">{registros.length}</span>
          </span>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <span>
              Exitosos: <span className="font-medium text-green-600">
                {registros.filter(r => r.estado === 'EXITOSO').length}
              </span>
            </span>
            <span>
              Fallidos: <span className="font-medium text-red-600">
                {registros.filter(r => r.estado === 'FALLIDO').length}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}