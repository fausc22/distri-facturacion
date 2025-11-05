import { useState, useEffect } from 'react';

// Función helper para formatear fechas
const formatearFecha = (fecha) => {
  if (!fecha) return 'N/A';
  
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

// Función para formatear JSON
const formatearJSON = (jsonString) => {
  if (!jsonString) return 'N/A';
  
  try {
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(parsed, null, 2);
  } catch (error) {
    return jsonString; // Si no es JSON válido, devolver como string
  }
};

// Función para obtener el estilo del estado
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

// Función para obtener el estilo del método HTTP
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

export default function ModalDetalleAuditoria({ 
  mostrar, 
  onClose, 
  registro,
  onObtenerDetalle,
  loading
}) {
  const [detalleCompleto, setDetalleCompleto] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  // Cargar detalle completo cuando se abre el modal
  useEffect(() => {
    if (mostrar && registro && onObtenerDetalle) {
      cargarDetalleCompleto();
    }
  }, [mostrar, registro]);

  const cargarDetalleCompleto = async () => {
    setCargandoDetalle(true);
    try {
      const detalle = await onObtenerDetalle(registro.id);
      setDetalleCompleto(detalle);
    } catch (error) {
      console.error('Error cargando detalle:', error);
    } finally {
      setCargandoDetalle(false);
    }
  };

  const handleClose = () => {
    setDetalleCompleto(null);
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!mostrar || !registro) return null;

  // Usar detalle completo si está disponible, sino usar el registro básico
  const datosAMostrar = detalleCompleto || registro;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-2 sm:p-4"
      onClick={handleOverlayClick}
    >
      <div 
        className="bg-white rounded-lg w-full max-w-xs sm:max-w-2xl lg:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 sm:p-4 lg:p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">
              📋 Detalle de Auditoría #{datosAMostrar.id}
            </h2>
            <button 
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 text-xl sm:text-2xl p-1"
            >
              ✕
            </button>
          </div>

          {/* Loading del detalle */}
          {cargandoDetalle && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3">Cargando detalle completo...</span>
            </div>
          )}

          {/* Contenido del detalle */}
          {!cargandoDetalle && (
            <div className="space-y-6">
              
              {/* Información Principal */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">Información Principal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-blue-700">ID:</span>
                    <p className="text-gray-700">{datosAMostrar.id}</p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-700">Fecha y Hora:</span>
                    <p className="text-gray-700">{formatearFecha(datosAMostrar.fecha_hora)}</p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-700">Acción:</span>
                    <p className="text-gray-700 font-semibold">{datosAMostrar.accion}</p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-700">Estado:</span>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium border mt-1 ${getEstadoStyle(datosAMostrar.estado)}`}>
                      {datosAMostrar.estado === 'EXITOSO' ? '✅ Exitoso' : '❌ Fallido'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Información del Usuario */}
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-800 mb-3">Usuario</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-green-700">ID de Usuario:</span>
                    <p className="text-gray-700">{datosAMostrar.usuario_id || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-green-700">Nombre de Usuario:</span>
                    <p className="text-gray-700 font-semibold">{datosAMostrar.usuario_nombre || 'Sistema'}</p>
                  </div>
                </div>
              </div>

              {/* Información Técnica */}
              <div className="bg-yellow-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-yellow-800 mb-3">Información Técnica</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-yellow-700">Tabla Afectada:</span>
                    <p className="text-gray-700">
                      {datosAMostrar.tabla_afectada ? (
                        <span className="bg-gray-200 px-2 py-1 rounded text-xs font-mono">
                          {datosAMostrar.tabla_afectada}
                        </span>
                      ) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-yellow-700">ID del Registro:</span>
                    <p className="text-gray-700">{datosAMostrar.registro_id || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-yellow-700">Endpoint:</span>
                    <p className="text-gray-700">
                      {datosAMostrar.endpoint ? (
                        <code className="bg-gray-200 px-2 py-1 rounded text-xs">
                          {datosAMostrar.endpoint}
                        </code>
                      ) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-yellow-700">Método HTTP:</span>
                    <p className="text-gray-700">
                      {datosAMostrar.metodo_http ? (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getMetodoStyle(datosAMostrar.metodo_http)}`}>
                          {datosAMostrar.metodo_http}
                        </span>
                      ) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Información de Red */}
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-purple-800 mb-3">Información de Red</h3>
                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-purple-700">Dirección IP:</span>
                    <p className="text-gray-700">
                      {datosAMostrar.ip_address ? (
                        <code className="bg-gray-200 px-2 py-1 rounded text-xs">
                          {datosAMostrar.ip_address}
                        </code>
                      ) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-purple-700">User Agent:</span>
                    <p className="text-gray-700 text-xs break-all">
                      {datosAMostrar.user_agent || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Detalles Adicionales */}
              {datosAMostrar.detalles_adicionales && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Detalles Adicionales</h3>
                  <div className="text-sm">
                    <pre className="bg-white p-3 rounded border text-xs overflow-x-auto whitespace-pre-wrap">
                      {formatearJSON(datosAMostrar.detalles_adicionales)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Información de Rendimiento */}
              {datosAMostrar.tiempo_procesamiento && (
                <div className="bg-indigo-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-indigo-800 mb-3">Rendimiento</h3>
                  <div className="text-sm">
                    <span className="font-medium text-indigo-700">Tiempo de Procesamiento:</span>
                    <p className="text-gray-700">
                      <span className="bg-indigo-200 px-2 py-1 rounded text-xs font-mono">
                        {datosAMostrar.tiempo_procesamiento} ms
                      </span>
                    </p>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Footer */}
          <div className="mt-8 flex justify-end">
            <button 
              onClick={handleClose}
              className="bg-gray-600 hover:bg-gray-700 text-white text-sm sm:text-lg font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-lg transition-colors"
            >
              CERRAR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}