import React, { useEffect, useId, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useScrollLock } from '../../hooks/shared/useScrollLock';
import { Z_INDEX } from '../../constants/zIndex';

/**
 * Componente modal base reutilizable
 * @param {boolean} isOpen - Estado de apertura del modal
 * @param {Function} onClose - Callback para cerrar
 * @param {string} title - Título del modal
 * @param {ReactNode} children - Contenido del modal
 * @param {boolean} loading - Estado de carga
 * @param {string} size - Tamaño del modal ('sm', 'md', 'lg', 'xl')
 */
export default function ModalBase({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  loading = false,
  size = 'md',
  closeOnOverlay = false,
  closeOnEscape = false,
  zIndexClass = '',
  zIndex = Z_INDEX.MODAL_BASE,
  panelClassName = '',
  contentClassName = '',
  showHeader = true
}) {
  useScrollLock(isOpen);
  const titleId = useId();
  const prefersReducedMotion = useReducedMotion();
  const panelRef = useRef(null);
  const previousFocusedElementRef = useRef(null);

  const getFocusableElements = () => {
    const panel = panelRef.current;
    if (!panel) return [];

    return Array.from(
      panel.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => el.tabIndex !== -1 && !el.hasAttribute('disabled'));
  };

  useEffect(() => {
    if (!isOpen) return undefined;

    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      previousFocusedElementRef.current = document.activeElement;
    }

    const rafId = window.requestAnimationFrame(() => {
      const focusables = getFocusableElements();
      if (focusables.length > 0) {
        focusables[0].focus();
      } else {
        panelRef.current?.focus();
      }
    });

    return () => window.cancelAnimationFrame(rafId);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) return;
    const previous = previousFocusedElementRef.current;
    if (previous && typeof document !== 'undefined' && document.contains(previous)) {
      previous.focus();
    }
    previousFocusedElementRef.current = null;
  }, [isOpen]);

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl'
  };

  const handleOverlayClick = (event) => {
    if (closeOnOverlay && !loading && event.target === event.currentTarget) {
      onClose?.();
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape' && closeOnEscape && !loading) {
      event.stopPropagation();
      onClose?.();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusables = getFocusableElements();
    const panel = panelRef.current;

    if (!panel || focusables.length === 0) {
      event.preventDefault();
      panel?.focus();
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const activeElement = document.activeElement;
    const isShiftPressed = event.shiftKey;

    if (isShiftPressed) {
      if (activeElement === first || !panel.contains(activeElement)) {
        event.preventDefault();
        last.focus();
      }
      return;
    }

    if (activeElement === last || !panel.contains(activeElement)) {
      event.preventDefault();
      first.focus();
    }
  };

  const overlayTransition = prefersReducedMotion
    ? { duration: 0.01 }
    : { duration: 0.18, ease: 'easeOut' };

  const panelTransition = prefersReducedMotion
    ? { duration: 0.01 }
    : { duration: 0.2, ease: 'easeOut' };

  const panelInitial = prefersReducedMotion
    ? { opacity: 0.99 }
    : { opacity: 0, y: 8, scale: 0.98 };

  const panelAnimate = prefersReducedMotion
    ? { opacity: 1 }
    : { opacity: 1, y: 0, scale: 1 };

  const panelExit = prefersReducedMotion
    ? { opacity: 0.99 }
    : { opacity: 0, y: 8, scale: 0.98 };

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          className={`fixed inset-0 bg-black bg-opacity-50 ${zIndexClass} flex items-center justify-center p-4`}
          onClick={handleOverlayClick}
          onKeyDown={handleKeyDown}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={overlayTransition}
          style={{
            zIndex,
            paddingTop: 'max(16px, env(safe-area-inset-top))',
            paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
            paddingLeft: 'max(16px, env(safe-area-inset-left))',
            paddingRight: 'max(16px, env(safe-area-inset-right))'
          }}
        >
          <motion.div
            ref={panelRef}
            className={`bg-white rounded-lg p-6 w-full ${sizeClasses[size]} max-h-[min(90dvh,90vh)] overflow-y-auto ${panelClassName}`}
            onClick={(event) => event.stopPropagation()}
            tabIndex={-1}
            initial={panelInitial}
            animate={panelAnimate}
            exit={panelExit}
            transition={panelTransition}
          >
            {showHeader && (
              <div className="flex justify-between items-center mb-6">
                <h2 id={titleId} className="text-xl font-bold text-gray-900">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold min-h-[44px] min-w-[44px] transition-transform active:scale-95"
                  disabled={loading}
                  aria-label="Cerrar modal"
                >
                  ×
                </button>
              </div>
            )}
            
            <div className={contentClassName}>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}