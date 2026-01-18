// components/OfflineGuard.jsx - SIMPLIFICADO: Usa ConnectionContext
import { useRouter } from 'next/router';
import { getAppMode } from '../utils/offlineManager';

/**
 * OfflineGuard - Componente pasivo que solo pasa children
 * La lógica de conexión está centralizada en ConnectionContext
 */
export default function OfflineGuard({ children }) {
  // Componente completamente pasivo - solo pasa children
  return children;
}

/**
 * NavbarGuard - Componente simplificado para navbar
 */
export function NavbarGuard({ children }) {
  return children;
}

/**
 * LinkGuard - Componente para enlaces con navegación
 */
export function LinkGuard({ href, children, className, ...props }) {
  const router = useRouter();
  const isPWA = getAppMode() === 'pwa';
  
  const handleClick = async (e) => {
    e.preventDefault();
    
    try {
      await router.push(href);
    } catch (error) {
      console.log('⚠️ Router falló, usando navegación directa');
      window.location.href = href;
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

/**
 * withOfflineGuard - HOC simplificado (ya no hace verificaciones)
 */
export function withOfflineGuard(Component, options = {}) {
  return function GuardedComponent(props) {
    return <Component {...props} />;
  };
}
