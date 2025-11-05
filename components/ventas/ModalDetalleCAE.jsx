import React from 'react';

const formatearFecha = (fecha) => {
  if (!fecha) return 'No disponible';
  
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

const formatearFechaSolo = (fecha) => {
  if (!fecha) return 'No disponible';
  
  return new Date(fecha).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export function ModalDetalleCAE({ mostrar, venta, onCerrar }) {
  if (!mostrar || !venta) return null;

  const getEstadoCAE = () => {
    // Si no hay CAE
    if (!venta.cae_id) {
      return { texto: 'Sin CAE', color: 'text-red-600', bg: 'bg-red-100', icon: '❌' };
    }
    
    // Limpiar y normalizar el valor
    const resultado = (venta.cae_resultado || '').toString().trim().toUpperCase();
    
    // Debug en consola
    console.log('🔍 DEBUG CAE Modal:', {
      venta_id: venta.id,
      cae_id: venta.cae_id,
      cae_resultado_raw: venta.cae_resultado,
      cae_resultado_clean: resultado,
      tipo: typeof venta.cae_resultado,
      length: resultado.length
    });
    
    // Verificar resultado
    if (resultado === 'A') {
      return { texto: 'Aprobado', color: 'text-green-600', bg: 'bg-green-100', icon: '✅' };
    }
    
    if (resultado === 'R') {
      return { texto: 'Rechazado', color: 'text-red-600', bg: 'bg-red-100', icon: '❌' };
    }
    
    // Si no coincide con ninguno
    return { 
      texto: `Desconocido (${resultado || 'vacío'})`, 
      color: 'text-gray-600', 
      bg: 'bg-gray-100', 
      icon: '❓' 
    };
  };

  const estado = getEstadoCAE();

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[80] p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                🧾 Detalle del CAE
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                Código de Autorización Electrónico - ARCA/AFIP
              </p>
            </div>
            <button
              onClick={onCerrar}
              className="text-white hover:text-blue-200 text-3xl font-bold transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Estado del CAE */}
          <div className={`${estado.bg} border-2 border-${estado.color.replace('text-', '')} rounded-lg p-4`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{estado.icon}</span>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Estado del CAE</p>
                  <p className={`text-xl font-bold ${estado.color}`}>{estado.texto}</p>
                </div>
              </div>
              {venta.cae_id && (
                <div className="text-right">
                  <p className="text-xs text-gray-500">CAE #</p>
                  <p className="text-lg font-mono font-bold text-gray-800">
                    {venta.cae_id}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Información del CAE */}
          {venta.cae_id && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CAE */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">🔑</div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-medium uppercase">Código CAE</p>
                    <p className="text-lg font-mono font-bold text-gray-800 break-all">
                      {venta.cae_id}
                    </p>
                  </div>
                </div>
              </div>

              {/* Fecha de vencimiento */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">📅</div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-medium uppercase">Fecha Vencimiento</p>
                    <p className="text-lg font-bold text-gray-800">
                      {formatearFechaSolo(venta.cae_fecha)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Fecha de solicitud */}
              {venta.cae_solicitud_fecha && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">⏰</div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 font-medium uppercase">Fecha Solicitud</p>
                      <p className="text-sm font-medium text-gray-800">
                        {formatearFecha(venta.cae_solicitud_fecha)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Resultado */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">📊</div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-medium uppercase">Resultado</p>
                    <p className="text-lg font-bold text-gray-800">
                      {(() => {
                        const resultado = (venta.cae_resultado || '').toString().trim().toUpperCase();
                        if (resultado === 'A') return 'Aprobado (A)';
                        if (resultado === 'R') return 'Rechazado (R)';
                        return resultado || 'No especificado';
                      })()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Observaciones */}
          {venta.cae_observaciones && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl">⚠️</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800 mb-2">
                    Observaciones de ARCA/AFIP
                  </p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {venta.cae_observaciones}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Información de la venta */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-500 uppercase mb-3">
              Información de la Venta
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Venta #</p>
                <p className="font-semibold text-gray-800">#{venta.id}</p>
              </div>
              <div>
                <p className="text-gray-500">Cliente</p>
                <p className="font-semibold text-gray-800">{venta.cliente_nombre}</p>
              </div>
              <div>
                <p className="text-gray-500">Total</p>
                <p className="font-semibold text-green-600">${Number(venta.total).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-500">Tipo Fiscal</p>
                <p className="font-semibold text-gray-800">Tipo {venta.tipo_f}</p>
              </div>
              <div>
                <p className="text-gray-500">Condición IVA</p>
                <p className="font-semibold text-gray-800">{venta.cliente_condicion}</p>
              </div>
              {venta.cliente_cuit && (
                <div>
                  <p className="text-gray-500">CUIT</p>
                  <p className="font-semibold text-gray-800 font-mono">{venta.cliente_cuit}</p>
                </div>
              )}
            </div>
          </div>

          
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg border-t border-gray-200">
          <button
            onClick={onCerrar}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalDetalleCAE;