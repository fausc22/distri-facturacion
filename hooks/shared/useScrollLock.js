import { useEffect } from 'react';

/**
 * Contador global de modales con scroll bloqueado.
 * Solo restauramos el body cuando el último modal se cierra (Fase 2).
 */
let scrollLockCount = 0;
let savedScrollY = 0;
let savedBodyStyles = null;

function saveBodyStyles() {
  const body = document.body;
  return {
    position: body.style.position,
    top: body.style.top,
    width: body.style.width,
    overflow: body.style.overflow,
    paddingRight: body.style.paddingRight
  };
}

function applyLock() {
  if (typeof document === 'undefined') return;
  const body = document.body;
  savedScrollY = window.scrollY || window.pageYOffset || 0;
  savedBodyStyles = saveBodyStyles();

  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

  body.style.position = 'fixed';
  body.style.top = `-${savedScrollY}px`;
  body.style.width = '100%';
  body.style.overflow = 'hidden';
  if (scrollbarWidth > 0) {
    body.style.paddingRight = `${scrollbarWidth}px`;
  }
}

function removeLock() {
  if (typeof document === 'undefined') return;
  const body = document.body;
  if (savedBodyStyles) {
    body.style.position = savedBodyStyles.position;
    body.style.top = savedBodyStyles.top;
    body.style.width = savedBodyStyles.width;
    body.style.overflow = savedBodyStyles.overflow;
    body.style.paddingRight = savedBodyStyles.paddingRight;
    savedBodyStyles = null;
  }
  window.scrollTo(0, savedScrollY);
}

/**
 * Bloquea el scroll del documento mientras un modal está abierto.
 * Con contador global: solo aplica lock al primer modal y solo restaura
 * cuando el último se cierra, evitando body fijo con modales anidados.
 */
export function useScrollLock(locked) {
  useEffect(() => {
    if (!locked || typeof document === 'undefined') return undefined;

    scrollLockCount += 1;
    if (scrollLockCount === 1) {
      applyLock();
    }

    return () => {
      scrollLockCount = Math.max(0, scrollLockCount - 1);
      if (scrollLockCount === 0) {
        removeLock();
      }
    };
  }, [locked]);
}

export default useScrollLock;
