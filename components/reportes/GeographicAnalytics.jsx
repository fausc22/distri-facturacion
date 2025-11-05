import React from 'react';

export function GeographicAnalytics() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Análisis Geográfico</h2>
          <p className="text-sm text-gray-500 mt-1">
            Análisis de ventas por ubicación geográfica
          </p>
        </div>
      </div>

      {/* ✅ MENSAJE INFORMATIVO - TEMPORALMENTE DESHABILITADO */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-8">
        <div className="flex items-center justify-center mb-6">
          <div className="flex-shrink-0">
            <svg className="h-16 w-16 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        </div>

        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            🚧 Análisis Geográfico en Mantenimiento
          </h3>
          
          <div className="max-w-2xl mx-auto space-y-4 text-gray-700">
            <p className="text-lg">
              <strong>El análisis geográfico está temporalmente deshabilitado</strong> debido a inconsistencias 
              en los datos de ciudades y provincias.
            </p>
            
            

            

            
          </div>

          

          
        </div>
      </div>

      
    </div>
  );
}