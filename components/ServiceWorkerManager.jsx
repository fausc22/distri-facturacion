import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

export default function ServiceWorkerManager() {
  const [waitingWorker, setWaitingWorker] = useState(null);
  const [showReload, setShowReload] = useState(false);

  useEffect(() => {
    // Solo ejecutar en cliente y si hay service worker
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Detectar nuevo service worker esperando
    const onSWUpdate = (registration) => {
      if (registration.waiting) {
        setWaitingWorker(registration.waiting);
        setShowReload(true);
      }
    };

    // Escuchar cambios en el service worker
    navigator.serviceWorker.ready.then((registration) => {
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Nuevo SW instalado y hay uno activo
            onSWUpdate(registration);
          }
        });
      });

      // Verificar si ya hay un SW esperando
      if (registration.waiting) {
        onSWUpdate(registration);
      }
    });

    // Escuchar mensaje del SW
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!window.refreshing) {
        window.refreshing = true;
        window.location.reload();
      }
    });

    // Verificar actualizaciones periódicamente (cada 60 minutos)
    const interval = setInterval(() => {
      navigator.serviceWorker.ready.then((registration) => {
        registration.update();
      });
    }, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (showReload) {
      const toastId = toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
          >
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <svg
                    className="h-10 w-10 text-blue-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Nueva versión disponible
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Hay una actualización de la aplicación disponible
                  </p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-200">
              <button
                onClick={() => {
                  if (waitingWorker) {
                    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
                  }
                  toast.dismiss(toastId);
                }}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none"
              >
                Actualizar
              </button>
            </div>
          </div>
        ),
        {
          duration: Infinity,
          position: 'bottom-center',
        }
      );
    }
  }, [showReload, waitingWorker]);

  return null;
}
