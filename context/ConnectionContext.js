// context/ConnectionContext.js
// FUENTE ÚNICA DE VERDAD para el estado de conexión de la PWA
// Principio: Desconexión automática, reconexión SOLO manual

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { getAppMode } from '../utils/offlineManager';
import {
  checkBackendConnectivity,
  connectivityErrorMessage,
} from '../utils/connectivity';

const ConnectionContext = createContext(null);

// Constantes
const PING_TIMEOUT = 15000; // 15 segundos para conexiones lentas (datos móviles)
const STORAGE_KEY = 'vertimar_modo_offline_forzado';

/**
 * ConnectionProvider - Proveedor centralizado del estado de conexión
 * 
 * COMPORTAMIENTO:
 * - Detecta automáticamente pérdida de conexión (navigator.onLine)
 * - Activa modo offline cuando se pierde conexión
 * - Reconexión SOLO cuando el usuario hace clic en "RECONECTAR APP"
 * - NO hace polling ni auto-reconexión
 */
export function ConnectionProvider({ children }) {
  const [modoOffline, setModoOffline] = useState(false);
  const [reconectando, setReconectando] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const inicializadoRef = useRef(false);

  // Detectar si es PWA
  useEffect(() => {
    setIsPWA(getAppMode() === 'pwa');
  }, []);

  // Inicialización: verificar estado guardado
  useEffect(() => {
    if (inicializadoRef.current) return;
    inicializadoRef.current = true;

    if (typeof window === 'undefined') return;

    // Verificar si hay modo offline guardado o si no hay conexión
    const modoGuardado = localStorage.getItem(STORAGE_KEY);
    const tieneConexionNavegador = navigator.onLine;

    if (modoGuardado === 'true' || !tieneConexionNavegador) {
      console.log('📴 [ConnectionContext] Iniciando en modo offline:', {
        modoGuardado: modoGuardado === 'true',
        navegadorOnline: tieneConexionNavegador
      });
      setModoOffline(true);
    } else {
      console.log('✅ [ConnectionContext] Iniciando en modo online');
      setModoOffline(false);
    }
  }, []);

  // Escuchar eventos de conexión del navegador
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOffline = () => {
      console.log('📴 [ConnectionContext] Conexión perdida - Activando modo offline');
      setModoOffline(true);
      localStorage.setItem(STORAGE_KEY, 'true');
      
      // Solo mostrar toast si es PWA
      if (getAppMode() === 'pwa') {
        toast('📴 Conexión perdida - Modo offline activado', {
          duration: 4000,
          icon: '📴',
          style: { background: '#f59e0b', color: '#fff' }
        });
      }
    };

    const handleOnline = () => {
      // Solo loguear, NO reconectar automáticamente
      console.log('🌐 [ConnectionContext] Navegador detecta conexión disponible');
      console.log('🌐 [ConnectionContext] Esperando reconexión manual del usuario...');
      // NO cambiar estado aquí - el usuario debe hacer clic en "RECONECTAR APP"
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  /**
   * Verificar conexión real con el backend usando /ping
   * @returns {Promise<boolean>} true si hay conexión real
   */
  const verificarConexionHealth = useCallback(async () => {
    console.log('🔍 [ConnectionContext] === VERIFICANDO CONEXIÓN (/ping) ===');
    const result = await checkBackendConnectivity(PING_TIMEOUT);
    console.log('📡 [ConnectionContext] Resultado:', {
      ok: result.ok,
      status: result.status,
      browserOnline: result.browserOnline,
      httpStatus: result.httpStatus,
      url: result.url,
      errorName: result.errorName,
      errorMessage: result.errorMessage,
    });
    return result.ok;
  }, []);

  /**
   * Reconectar la aplicación - SOLO se llama cuando el usuario hace clic
   * @returns {Promise<boolean>} true si la reconexión fue exitosa
   */
  const reconectar = useCallback(async () => {
    console.log('🔄 [ConnectionContext] ========================================');
    console.log('🔄 [ConnectionContext] USUARIO SOLICITÓ RECONEXIÓN');
    console.log('🔄 [ConnectionContext] ========================================');
    
    setReconectando(true);

    try {
      console.log('🔄 [ConnectionContext] Llamando a checkBackendConnectivity()...');
      const result = await checkBackendConnectivity(PING_TIMEOUT);
      console.log(`🔄 [ConnectionContext] Resultado de verificación: ${result.ok} (${result.status})`);

      if (result.ok) {
        console.log('✅ [ConnectionContext] RECONEXIÓN EXITOSA');
        
        // Desactivar modo offline
        setModoOffline(false);
        localStorage.removeItem(STORAGE_KEY);
        console.log('✅ [ConnectionContext] Estado actualizado y localStorage limpiado');
        
        toast.success('✅ App reconectada - Modo online activado', {
          duration: 3000,
          icon: '✅'
        });

        // Recargar página para actualizar toda la UI
        console.log('✅ [ConnectionContext] Recargando página en 1.5s...');
        setTimeout(() => {
          window.location.reload();
        }, 1500);

        return true;
      } else {
        console.log('❌ [ConnectionContext] RECONEXIÓN FALLIDA -', result.status);
        
        toast.error(connectivityErrorMessage(result.status), {
          duration: 5000,
          icon: '❌'
        });

        return false;
      }
    } catch (error) {
      console.error('❌ [ConnectionContext] ERROR CRÍTICO EN RECONEXIÓN:', error);
      console.error('❌ [ConnectionContext] Tipo:', error.name);
      console.error('❌ [ConnectionContext] Mensaje:', error.message);
      
      toast.error('Error al intentar reconectar. Intente nuevamente.', {
        duration: 5000,
        icon: '❌'
      });

      return false;
    } finally {
      setReconectando(false);
      console.log('🔄 [ConnectionContext] Estado reconectando = false');
    }
  }, []);

  /**
   * Forzar modo offline manualmente (para testing o casos especiales)
   */
  const forzarModoOffline = useCallback(() => {
    console.log('📴 [ConnectionContext] Forzando modo offline manualmente');
    setModoOffline(true);
    localStorage.setItem(STORAGE_KEY, 'true');
  }, []);

  // Valor del contexto
  const value = {
    // Estados
    modoOffline,        // true = app en modo offline (naranja)
    reconectando,       // true = intentando reconectar
    isPWA,              // true = ejecutando como PWA
    
    // Funciones
    reconectar,         // Llamar cuando el usuario hace clic en "RECONECTAR APP"
    forzarModoOffline,  // Para testing o casos especiales
    verificarConexionHealth // Para verificaciones puntuales si se necesita
  };

  return (
    <ConnectionContext.Provider value={value}>
      {children}
    </ConnectionContext.Provider>
  );
}

/**
 * Hook para consumir el ConnectionContext
 * @returns {Object} Estado y funciones de conexión
 */
export function useConnectionContext() {
  const context = useContext(ConnectionContext);
  
  if (!context) {
    throw new Error('useConnectionContext debe usarse dentro de ConnectionProvider');
  }
  
  return context;
}

// Exportar también el contexto por si se necesita acceso directo
export default ConnectionContext;
