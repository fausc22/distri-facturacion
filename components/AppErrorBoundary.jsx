// components/AppErrorBoundary.jsx - Captura errores de React en el cliente y muestra pantalla amigable
import React from 'react';

/**
 * Error Boundary de clase (requerido por React para componentDidCatch).
 * Muestra "Algo salió mal" con botón Recargar en lugar del mensaje genérico de Vercel/Next.
 */
class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🔴 [AppErrorBoundary] Error capturado:', error, errorInfo?.componentStack);
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex flex-col items-center justify-center p-6 bg-secondary-light dark:bg-primary-dark"
          style={{
            paddingTop: 'calc(1.5rem + env(safe-area-inset-top))',
            paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))',
          }}
        >
          <div className="max-w-md w-full text-center">
            <div className="mb-6 text-6xl" aria-hidden>
              ⚠️
            </div>
            <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Algo salió mal
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Ocurrió un error inesperado. Recargá la página para intentar de nuevo.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
            >
              Recargar
            </button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-8 text-left">
                <summary className="text-sm text-gray-500 cursor-pointer">
                  Ver detalle (solo desarrollo)
                </summary>
                <pre className="mt-2 p-3 text-xs bg-gray-100 dark:bg-gray-800 rounded overflow-auto max-h-40">
                  {this.state.error?.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
