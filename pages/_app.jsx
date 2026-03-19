// pages/_app.jsx - VERSIÓN CORREGIDA CON AuthProvider GLOBAL
import '../styles/globals.css';
import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast'; 
import { useRouter } from 'next/router'
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../utils/queryClient';
import { AuthProvider } from '../components/AuthProvider';
import { ConnectionProvider } from '../context/ConnectionContext';
import DefaultLayout from '../components/DefaultLayout';
import AppInitializer from '../components/AppInitializer';
import OfflineGuard from '../components/OfflineGuard';
import PublicLayout from '../components/PublicLayout';
import AppErrorBoundary from '../components/AppErrorBoundary';
import { Z_INDEX } from '../constants/zIndex';

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  
  // ✅ PÁGINAS PÚBLICAS - Sin autenticación ni AppHeader
  const publicRoutes = [
    '/login',
    '/comprobante-publico',
  ];
  
  // ✅ Verificar si es página pública
  const isPublicRoute = publicRoutes.some(route => 
    router.pathname.startsWith(route)
  );

  // ✅ PRECARGA CRÍTICA PARA PWA OFFLINE
  // router.prefetch() descarga los chunks JS de cada ruta - esencial para que funcione offline
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                  window.navigator.standalone ||
                  document.referrer.includes('android-app://');

    if (!isPWA) return;

    const PRECACHE_KEY = 'vertimar_precarga_completa';
    const RUTAS_CRITICAS = ['/ventas/RegistrarPedido', '/inicio', '/login', '/'];

    const ejecutarPrecarga = async () => {
      if (!navigator.onLine) return;

      console.log('📱 [PWA] Iniciando precarga de rutas críticas...');

      try {
        // 1. router.prefetch() - CRÍTICO: descarga los chunks JS de cada página
        for (const ruta of RUTAS_CRITICAS) {
          try {
            await router.prefetch(ruta);
            console.log(`✅ [PWA] Chunks precargados: ${ruta}`);
          } catch (e) {
            console.warn(`⚠️ [PWA] Prefetch ${ruta}:`, e.message);
          }
        }

        // 2. fetch() adicional para cachear el documento HTML (el SW lo intercepta)
        const delay = (ms) => new Promise((r) => setTimeout(r, ms));
        for (let i = 0; i < RUTAS_CRITICAS.length; i++) {
          await delay(300);
          fetch(RUTAS_CRITICAS[i], {
            method: 'GET',
            credentials: 'include',
            cache: 'force-cache',
          }).catch(() => {});
        }

        const primeraVez = !localStorage.getItem(PRECACHE_KEY);
        localStorage.setItem(PRECACHE_KEY, Date.now().toString());
        console.log('✅ [PWA] Precarga completa - App lista para offline');
        if (primeraVez) {
          toast.success('📱 App lista para usar sin conexión', { duration: 3000, icon: '✅' });
        }
      } catch (error) {
        console.warn('⚠️ [PWA] Error en precarga:', error.message);
      }
    };

    // Ejecutar tras carga inicial (no bloquear)
    const timer = setTimeout(() => {
      ejecutarPrecarga();
    }, 1500);

    return () => clearTimeout(timer);
  }, [router]);

  // ✅ LISTENER SERVICE WORKER (solo en rutas privadas)
  useEffect(() => {
    if (isPublicRoute || typeof window === 'undefined') return;

    const onControllerChange = () => {
      console.log('🔄 Service Worker actualizado, recargando...');
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, [isPublicRoute]);

  // ✅ ACTUALIZACIÓN MANUAL DE PWA (sin tocar estrategia de caché)
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    window.__forcePwaUpdate = async () => {
      try {
        if (!navigator.onLine) {
          toast('📴 Sin conexión: conectate para buscar actualizaciones', {
            duration: 2500,
            icon: '📴',
          });
          return;
        }

        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration) {
          toast('ℹ️ No se encontró Service Worker activo', {
            duration: 2500,
            icon: 'ℹ️',
          });
          return;
        }

        toast.loading('🔎 Buscando actualización...');
        await registration.update();

        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          toast.dismiss();
          toast.success('🔄 Aplicando actualización...');
          return;
        }

        if (registration.installing) {
          registration.installing.addEventListener('statechange', () => {
            if (registration.waiting) {
              registration.waiting.postMessage({ type: 'SKIP_WAITING' });
              toast.dismiss();
              toast.success('🔄 Aplicando actualización...');
            }
          });
          return;
        }

        toast.dismiss();
        toast.success('✅ Ya estás en la versión más reciente');
      } catch (error) {
        toast.dismiss();
        toast.error('❌ No se pudo actualizar la app');
        console.warn('⚠️ [PWA] Error en actualización manual:', error?.message);
      }
    };

    return () => {
      delete window.__forcePwaUpdate;
    };
  }, []);

  // ✅ VERIFICAR REGISTRO DEL SERVICE WORKER
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg) {
        reg.addEventListener('updatefound', () => {
          console.log('🔄 Nueva versión del Service Worker disponible');
        });
      }
    });
  }, []);

  // ✅ MANEJO DE ERRORES DE RED GLOBAL
  useEffect(() => {
    if (isPublicRoute) return;
    
    const handleUnhandledRejection = (event) => {
      if (event.reason && event.reason.message && event.reason.message.includes('fetch')) {
        console.log('🌐 Error de red capturado globalmente:', event.reason.message);
        event.preventDefault();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [isPublicRoute]);

  // ✅ DETECCIÓN DE CAMBIOS DE CONECTIVIDAD
  useEffect(() => {
    if (isPublicRoute) return;
    
    if (typeof window !== 'undefined') {
      const handleOnline = () => {
        console.log('🌐 Aplicación volvió online');
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistration().then((registration) => {
            if (registration) {
              registration.update();
            }
          });
        }
      };

      const handleOffline = () => {
        console.log('📴 Aplicación ahora offline');
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [isPublicRoute]);

  // ✅ COMPONENTE RENDERIZADO CON AuthProvider GLOBAL
  const getLayout = Component.getLayout || ((page) => (
    isPublicRoute ? page : <DefaultLayout>{page}</DefaultLayout>
  ));

  return (
    <AnimatePresence>
      <AppErrorBoundary>
      {/* ✅ FASE 2: React Query Provider (solo memoria, PWA-safe) */}
      <QueryClientProvider client={queryClient}>
        {/* ✅ AuthProvider AHORA ENVUELVE TODO - Públicas y privadas */}
        <AuthProvider>
        {isPublicRoute ? (
          // ✅ PÁGINAS PÚBLICAS - Solo PublicLayout + Toaster básico
          <PublicLayout>
            <Component {...pageProps} />
          </PublicLayout>
        ) : (
          // ✅ PÁGINAS PRIVADAS - Layout completo con inicializadores
          <ConnectionProvider>
            <AppInitializer>
              <OfflineGuard>
              <div className="bg-secondary-light dark:bg-primary-dark transition duration-300">
                {getLayout(<Component {...pageProps} />)}
                
                {/* ✅ TOASTER MEJORADO PARA PWA */}
                <Toaster
                  position="top-center"
                  containerStyle={{
                    top: 'calc(12px + env(safe-area-inset-top))',
                    left: 12,
                    right: 12,
                    zIndex: Z_INDEX.TOAST,
                  }}
                  toastOptions={{
                    duration: 2000,
                    className: 'pwa-toast',
                    style: {
                      background: '#363636',
                      color: '#fff',
                      fontSize: '15px',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    },
                    success: {
                      duration: 2000,
                      style: {
                        background: '#10b981',
                        color: 'white',
                      },
                      iconTheme: {
                        primary: 'white',
                        secondary: '#10b981',
                      },
                    },
                    error: {
                      duration: 3000,
                      style: {
                        background: '#ef4444',
                        color: 'white',
                      },
                      iconTheme: {
                        primary: 'white',
                        secondary: '#ef4444',
                      },
                    },
                    warning: {
                      duration: 2000,
                      style: {
                        background: '#f59e0b',
                        color: 'white',
                      },
                      iconTheme: {
                        primary: 'white',
                        secondary: '#f59e0b',
                      },
                    },
                    loading: {
                      duration: 2000,
                      style: {
                        background: '#3b82f6',
                        color: 'white',
                      },
                    },
                    custom: {
                      duration: 2000,
                    },
                    ariaProps: {
                      role: 'status',
                      'aria-live': 'polite',
                    },
                  }}
                />
              </div>
              </OfflineGuard>
            </AppInitializer>
          </ConnectionProvider>
        )}
        </AuthProvider>
      </QueryClientProvider>
      </AppErrorBoundary>
    </AnimatePresence>
  );
}

export default MyApp;