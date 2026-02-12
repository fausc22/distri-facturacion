import { useEffect } from 'react';

/**
 * Bloquea el scroll del documento mientras un modal está abierto.
 * Mantiene la posición actual para evitar "saltos" al cerrar.
 */
export function useScrollLock(locked) {
  useEffect(() => {
    if (!locked || typeof document === 'undefined') return undefined;

    const body = document.body;
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const previousPosition = body.style.position;
    const previousTop = body.style.top;
    const previousWidth = body.style.width;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;

    // Compensar barra de scroll para evitar "layout shift" en desktop.
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      body.style.position = previousPosition;
      body.style.top = previousTop;
      body.style.width = previousWidth;
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
      window.scrollTo(0, scrollY);
    };
  }, [locked]);
}

export default useScrollLock;
