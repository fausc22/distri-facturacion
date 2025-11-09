// components/OfflineGuard.jsx - ULTRA SIMPLIFICADO: NUNCA redirige automáticamente
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useConnection } from '../utils/ConnectionManager';
import { getAppMode } from '../utils/offlineManager';

export default function OfflineGuard({ children }) {
  const router = useRouter();
  const { isOnline, eventType } = useConnection();
  
  const isPWA = getAppMode() === 'pwa';

  // ✅ COMPONENTE COMPLETAMENTE PASIVO - NUNCA REDIRIGE
  useEffect(() => {
    if (!isPWA || !eventType) return;

    const currentPath = router.pathname;

    // ✅ SOLO LOGGING PASIVO - NUNCA ACCIONES AUTOMÁTICAS
    switch (eventType) {
      case 'connection_lost':
        console.log(`📴 [OfflineGuard] Conexión perdida detectada en: ${currentPath} - SIN ACCIÓN`);
        break;
        
      case 'connection_restored':
        console.log(`🌐 [OfflineGuard] Conexión restaurada detectada en: ${currentPath} - SIN ACCIÓN`);
        break;
        
      default:
        break;
    }
  }, [eventType, router.pathname, isPWA]);

  // ✅ NO HAY VERIFICACIONES INICIALES
  // ✅ NO HAY REDIRECCIONES AUTOMÁTICAS
  // ✅ NO HAY LÓGICA DE PROTECCIÓN AUTOMÁTICA
  
  // El componente simplemente pasa los children sin modificaciones
  console.log('🛡️ [OfflineGuard] Modo pasivo - sin redirecciones automáticas');
  
  return children;
}

// ✅ COMPONENTE SIMPLIFICADO PARA NAVBAR
export function NavbarGuard({ children }) {
  // El navbar siempre se muestra sin restricciones
  return children;
}

// ✅ COMPONENTE SIMPLIFICADO PARA ENLACES - SIN RESTRICCIONES EN PWA
export function LinkGuard({ href, children, className, ...props }) {
  const router = useRouter();
  const isPWA = getAppMode() === 'pwa';
  
  const handleClick = async (e) => {
    // ✅ EN PWA: NAVEGACIÓN LIBRE SIN RESTRICCIONES
    // El modo offline ya maneja bien las conexiones
    if (isPWA) {
      e.preventDefault();
      console.log(`✅ [LinkGuard PWA] Navegación libre a: ${href}`);
      
      try {
        await router.push(href);
      } catch (error) {
        console.log('⚠️ Router falló, usando navegación directa');
        window.location.href = href;
      }
      return false;
    }
    
    // Navegación normal para web browser
    console.log(`✅ [LinkGuard Web] Navegación a: ${href}`);
    if (props.onClick) {
      props.onClick(e);
    }
  };

  return (
    <a
      href={href}
      className={className}
      onClick={handleClick}
      {...props}
    >
      {children}
    </a>
  );
}

// ✅ HOC ULTRA SIMPLIFICADO
export function withOfflineGuard(Component, options = {}) {
  const { allowOffline = false } = options;

  return function GuardedComponent(props) {
    const { checkOnDemand } = useConnection();
    const router = useRouter();
    const isPWA = getAppMode() === 'pwa';
    const [checking, setChecking] = useState(false);

    // ✅ SOLO verificar si la ruta específicamente NO permite offline
    // Y SOLO para rutas que estrictamente requieren online
    useEffect(() => {
      if (!isPWA || allowOffline) {
        return;
      }

      const currentRoute = router.pathname;
      
      // ✅ SOLO rutas que ESTRICTAMENTE requieren online
      const strictOnlineRoutes = [
        '/inventario',
        '/compras',
        '/finanzas', 
        '/edicion'
      ];
      
      const needsStrictOnline = strictOnlineRoutes.some(route => currentRoute.includes(route));
      
      // ✅ SOLO verificar si estamos en una ruta estricta Y parece que no hay conexión
      if (needsStrictOnline) {
        console.log(`🔍 [withOfflineGuard] Ruta estricta detectada: ${currentRoute}`);
        setChecking(true);
        
        // Verificar conexión bajo demanda una sola vez
        checkOnDemand().then(hayConexion => {
          if (!hayConexion) {
            console.log(`📴 [withOfflineGuard] Sin conexión en ruta estricta, redirigiendo a inicio`);
            router.push('/inicio');
          } else {
            console.log(`🌐 [withOfflineGuard] Conexión confirmada para ruta estricta`);
          }
          setChecking(false);
        });
      }
    }, [router.pathname, allowOffline, checkOnDemand]);

    if (checking) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Verificando acceso...</p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}