// pages/_offline.jsx
// Página de respaldo cuando el usuario está offline y la ruta no está cacheada.
// next-pwa la precachea automáticamente y la sirve como fallback.

import Head from 'next/head';
import Link from 'next/link';

export default function OfflinePage() {
  const handleRetry = () => {
    if (navigator.onLine) {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <Head>
        <title>VERTIMAR | Sin conexión</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        {/* Icono */}
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-orange-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Sin conexión a internet
        </h1>

        <p className="text-gray-600 mb-6">
          No se pudo cargar esta página. Podés seguir trabajando con los módulos
          offline y sincronizar cuando vuelva la conexión.
        </p>

        <p className="text-sm text-gray-500 mb-6">
          Consejo: cargá catálogo y rutas críticas con internet al menos una vez
          antes de salir a campo.
        </p>

        <button
          onClick={handleRetry}
          className="w-full py-3 px-6 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!navigator.onLine}
        >
          {navigator.onLine ? '🔄 Reintentar' : 'Sin conexión'}
        </button>

        <Link
          href="/inicio"
          className="mt-4 block text-orange-600 hover:text-orange-700 font-medium text-sm"
        >
          Ir al inicio
        </Link>
        <Link
          href="/ventas/HistorialPedidosOffline"
          className="mt-2 block text-orange-600 hover:text-orange-700 font-medium text-sm"
        >
          Ir al historial offline
        </Link>
        <Link
          href="/ventas/RegistrarPedido"
          className="mt-2 block text-orange-600 hover:text-orange-700 font-medium text-sm"
        >
          Registrar pedido offline
        </Link>
      </div>
    </div>
  );
}
