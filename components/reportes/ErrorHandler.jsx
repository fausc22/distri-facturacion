import React from 'react';

export function ReportesErrorBoundary({ children, error, onRetry, filtros }) {
  if (error) {
    return <ErrorDisplay error={error} onRetry={onRetry} filtros={filtros} />;
  }
  
  return children;
}

export function ErrorDisplay({ error, onRetry, filtros }) {
  const getErrorInfo = () => {
    const errorMessage = error?.message || error || 'Error desconocido';
    
    // Analizar tipos comunes de errores
    if (errorMessage.includes('500')) {
      return {
        tipo: 'server',
        titulo: 'Error del Servidor',
        descripcion: 'Hubo un problema procesando la consulta en el servidor.',
        sugerencias: [
          'Verifica que el período seleccionado contenga datos',
          'Intenta con un rango de fechas más pequeño',
          'Revisa que haya ventas registradas en el período'
        ]
      };
    }
    
    if (errorMessage.includes('404') || errorMessage.includes('no encontr')) {
      return {
        tipo: 'nodata',
        titulo: 'Sin Datos',
        descripcion: 'No se encontraron datos para el período seleccionado.',
        sugerencias: [
          'Registra algunas ventas en el sistema',
          'Selecciona un período diferente',
          'Verifica que las fechas sean correctas'
        ]
      };
    }
    
    if (errorMessage.includes('parámetros') || errorMessage.includes('fecha')) {
      return {
        tipo: 'params',
        titulo: 'Parámetros Inválidos',
        descripcion: 'Los filtros o fechas seleccionados no son válidos.',
        sugerencias: [
          'Verifica que las fechas estén en formato correcto',
          'La fecha "desde" debe ser anterior a "hasta"',
          'Selecciona un período válido'
        ]
      };
    }
    
    if (errorMessage.includes('network') || errorMessage.includes('conexión')) {
      return {
        tipo: 'network',
        titulo: 'Error de Conexión',
        descripcion: 'No se pudo conectar con el servidor.',
        sugerencias: [
          'Verifica tu conexión a internet',
          'El servidor puede estar temporalmente no disponible',
          'Intenta nuevamente en unos momentos'
        ]
      };
    }
    
    return {
      tipo: 'unknown',
      titulo: 'Error Inesperado',
      descripcion: errorMessage,
      sugerencias: [
        'Intenta recargar la página',
        'Verifica tu conexión a internet',
        'Contacta al administrador si el problema persiste'
      ]
    };
  };

  const errorInfo = getErrorInfo();

  const getIconForErrorType = (tipo) => {
    switch (tipo) {
      case 'server':
        return (
          <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'nodata':
        return (
          <svg className="w-12 h-12 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        );
      case 'params':
        return (
          <svg className="w-12 h-12 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'network':
        return (
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
        );
      default:
        return (
          <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg p-8 border border-gray-200 text-center">
      <div className="flex flex-col items-center">
        {getIconForErrorType(errorInfo.tipo)}
        
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          {errorInfo.titulo}
        </h3>
        
        <p className="mt-2 text-sm text-gray-600 max-w-sm">
          {errorInfo.descripcion}
        </p>

        {/* Información de filtros actuales */}
        {filtros && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
            <strong>Filtros actuales:</strong>
            <div className="mt-1">
              Período: {filtros.desde} a {filtros.hasta} ({filtros.periodo})
            </div>
          </div>
        )}

        {/* Sugerencias */}
        <div className="mt-6 text-left">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Sugerencias:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {errorInfo.sugerencias.map((sugerencia, index) => (
              <li key={index} className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                {sugerencia}
              </li>
            ))}
          </ul>
        </div>

        {/* Botones de acción */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Reintentar
            </button>
          )}
          
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Recargar Página
          </button>
        </div>

        {/* Información técnica (solo en desarrollo) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 text-xs text-gray-500">
            <summary className="cursor-pointer">Detalles técnicos</summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-left overflow-auto">
              {JSON.stringify({ error: error?.message || error, filtros }, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

// Componente para mostrar cuando no hay datos
export function NoDataDisplay({ tipo = 'general', onAction, actionLabel = 'Registrar Datos' }) {
  const getNoDataInfo = () => {
    switch (tipo) {
      case 'ventas':
        return {
          titulo: 'No hay ventas registradas',
          descripcion: 'Para ver estadísticas de ventas, primero necesitas registrar algunas ventas en el sistema.',
          icono: (
            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          ),
          sugerencias: [
            'Ve a la sección de ventas y registra una venta',
            'Importa datos de ventas si los tienes en otro formato',
            'Verifica que las fechas del filtro incluyan ventas existentes'
          ]
        };
      case 'productos':
        return {
          titulo: 'No hay productos vendidos',
          descripcion: 'No se encontraron productos vendidos en el período seleccionado.',
          icono: (
            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          ),
          sugerencias: [
            'Verifica que el período seleccionado incluya ventas',
            'Registra algunas ventas de productos',
            'Amplía el rango de fechas del filtro'
          ]
        };
      case 'empleados':
        return {
          titulo: 'No hay datos de empleados',
          descripcion: 'No se encontraron ventas realizadas por empleados en el período.',
          icono: (
            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          ),
          sugerencias: [
            'Verifica que las ventas tengan empleados asignados',
            'Registra empleados en el sistema',
            'Asigna empleados a las ventas existentes'
          ]
        };
      default:
        return {
          titulo: 'No hay datos disponibles',
          descripcion: 'No se encontraron datos para mostrar en este reporte.',
          icono: (
            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          ),
          sugerencias: [
            'Verifica los filtros aplicados',
            'Selecciona un período diferente',
            'Registra algunos datos en el sistema'
          ]
        };
    }
  };

  const noDataInfo = getNoDataInfo();

  return (
    <div className="bg-white rounded-lg p-12 border border-gray-200 text-center">
      <div className="flex flex-col items-center">
        {noDataInfo.icono}
        
        <h3 className="mt-6 text-xl font-medium text-gray-900">
          {noDataInfo.titulo}
        </h3>
        
        <p className="mt-3 text-sm text-gray-600 max-w-md">
          {noDataInfo.descripcion}
        </p>

        <div className="mt-6 text-left">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Qué puedes hacer:</h4>
          <ul className="text-sm text-gray-600 space-y-2">
            {noDataInfo.sugerencias.map((sugerencia, index) => (
              <li key={index} className="flex items-start">
                <span className="text-blue-500 mr-3 mt-0.5">→</span>
                {sugerencia}
              </li>
            ))}
          </ul>
        </div>

        {onAction && (
          <button
            onClick={onAction}
            className="mt-8 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

// Hook para manejar errores de reportes
export function useReportesErrorHandler() {
  const [error, setError] = useState(null);
  const [retryFunction, setRetryFunction] = useState(null);

  const handleError = (error, retryFn = null) => {
    console.error('Error en reportes:', error);
    setError(error);
    setRetryFunction(() => retryFn);
  };

  const clearError = () => {
    setError(null);
    setRetryFunction(null);
  };

  const retry = () => {
    if (retryFunction) {
      clearError();
      retryFunction();
    }
  };

  return {
    error,
    hasError: !!error,
    handleError,
    clearError,
    retry,
    ErrorComponent: ({ filtros, children }) => (
      <ReportesErrorBoundary 
        error={error} 
        onRetry={retryFunction ? retry : null}
        filtros={filtros}
      >
        {children}
      </ReportesErrorBoundary>
    )
  };
}