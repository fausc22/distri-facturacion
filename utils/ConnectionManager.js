// utils/ConnectionManager.js - Detección mejorada de conectividad
import { toast } from 'react-hot-toast';
import { getAppMode } from './offlineManager';

class ConnectionManager {
  constructor() {
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.listeners = new Set();
    this.checkInterval = null;
    this.isTransitioning = false;
    this.reconnectionAttempts = 0;
    this.lastCheckTime = 0;
    this.isPWA = false;

    // Solo inicializar en cliente
    if (typeof window !== 'undefined') {
      this.isPWA = getAppMode() === 'pwa';
      this.init();
    }
  }

  init() {
    console.log('🔌 ConnectionManager iniciado');

    // Listeners nativos del navegador
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Listener para reactivación de PWA/tab
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    window.addEventListener('focus', this.handleFocus.bind(this));

    // Verificar conexión real al inicio
    setTimeout(() => this.checkConnectionOnDemand(), 1000);

    console.log(`🌐 Estado inicial: ${this.isOnline ? 'ONLINE' : 'OFFLINE'}`);
  }

  // Manejar evento online del navegador
  async handleOnline() {
    console.log('🌐 Evento ONLINE detectado por navegador');

    // Verificar que realmente hay conexión (no confiar solo en navigator.onLine)
    const reallyOnline = await this.verifyRealConnection();

    if (reallyOnline && !this.isOnline) {
      this.isOnline = true;
      this.reconnectionAttempts = 0;
      this.handleConnectionRestored();
    }
  }

  // Manejar evento offline del navegador
  handleOffline() {
    console.log('📴 Evento OFFLINE detectado por navegador');

    if (this.isOnline) {
      this.isOnline = false;
      this.handleConnectionLost();
    }
  }

  // Verificar conexión cuando la PWA/tab se vuelve visible
  async handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      console.log('👁️ App visible - verificando conexión...');

      // Esperar un poco para que la red se estabilice
      setTimeout(async () => {
        const wasOnline = this.isOnline;
        const isOnlineNow = await this.checkConnectionOnDemand();

        // Solo notificar si hubo cambio
        if (wasOnline !== isOnlineNow) {
          if (isOnlineNow) {
            this.handleConnectionRestored();
          } else {
            this.handleConnectionLost();
          }
        }
      }, 500);
    }
  }

  // Verificar conexión cuando la ventana obtiene foco
  async handleFocus() {
    console.log('🔍 Ventana obtuvo foco - verificando conexión...');

    // Solo verificar si han pasado más de 5 segundos desde la última verificación
    const now = Date.now();
    if (now - this.lastCheckTime > 5000) {
      await this.checkConnectionOnDemand();
    }
  }

  // Notificar pérdida de conexión
  handleConnectionLost() {
    if (this.isTransitioning) return;

    console.log('📴 Conexión perdida');
    this.isTransitioning = true;

    // Notificar a listeners
    this.notifyListeners('connection_lost', {
      isOnline: false,
      message: 'Sin conexión a internet'
    });

    // Solo mostrar toast en PWA
    if (this.isPWA) {
      toast.error('📴 Sin conexión a internet', {
        duration: 3000,
        id: 'offline-toast'
      });
    }

    setTimeout(() => {
      this.isTransitioning = false;
    }, 1000);
  }

  // Notificar restauración de conexión
  handleConnectionRestored() {
    if (this.isTransitioning) return;

    console.log('🌐 Conexión restaurada');
    this.isTransitioning = true;

    // Notificar a listeners
    this.notifyListeners('connection_restored', {
      isOnline: true,
      message: 'Conexión restaurada'
    });

    // Solo mostrar toast en PWA
    if (this.isPWA) {
      toast.success('✅ Conexión restaurada', {
        duration: 3000,
        id: 'online-toast'
      });
    }

    setTimeout(() => {
      this.isTransitioning = false;
    }, 2000);
  }

  // Verificar que realmente hay conexión (no solo navigator.onLine)
  async verifyRealConnection() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);
      return response.ok;

    } catch (error) {
      return false;
    }
  }

  // Verificación bajo demanda
  async checkConnectionOnDemand() {
    console.log('🔍 Verificación de conexión bajo demanda...');
    this.lastCheckTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);

      const isOnline = response.ok;
      const wasOnline = this.isOnline;
      this.isOnline = isOnline;

      console.log(`✅ Resultado: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);

      return isOnline;

    } catch (error) {
      console.log('❌ Verificación falló:', error.message);
      this.isOnline = false;
      return false;
    }
  }

  // ✅ SISTEMA DE LISTENERS PARA UI
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(eventType, data) {
    this.listeners.forEach(callback => {
      try {
        callback(eventType, {
          isOnline: this.isOnline,
          ...data
        });
      } catch (error) {
        console.error('Error notificando listener:', error);
      }
    });
  }

  // ✅ MÉTODOS PÚBLICOS
  getConnectionState() {
    return {
      isOnline: this.isOnline,
      isTransitioning: this.isTransitioning,
      isPWA: this.isPWA
    };
  }

  // ✅ VERIFICACIÓN FORZADA MANUAL
  async forceConnectionCheck() {
    console.log('🔄 Verificación de conexión FORZADA MANUAL');
    return await this.checkConnectionOnDemand();
  }

  // ✅ NO HAY VERIFICACIÓN PERIÓDICA AUTOMÁTICA
  // Esta función ya no se usa para evitar cambios automáticos
  startPeriodicCheck() {
    console.log('⚠️ Verificación periódica NO INICIADA - Modo estable activado');
    // No hacer nada - mantener estabilidad total
  }

  destroy() {
    console.log('🧹 Destruyendo ConnectionManager');
    
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline.bind(this));
      window.removeEventListener('offline', this.handleOffline.bind(this));
      document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
      window.removeEventListener('focus', this.handleFocus.bind(this));
    }
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    
    this.listeners.clear();
  }

  waitForConnection(timeout = 10000) {
    return new Promise((resolve, reject) => {
      if (this.isOnline) {
        resolve(true);
        return;
      }
      
      const timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error('Timeout esperando conexión'));
      }, timeout);
      
      const cleanup = this.addListener((eventType, data) => {
        if (data.isOnline) {
          clearTimeout(timeoutId);
          cleanup();
          resolve(true);
        }
      });
    });
  }

  getDebugInfo() {
    return {
      isOnline: this.isOnline,
      isTransitioning: this.isTransitioning,
      isPWA: this.isPWA,
      reconnectionAttempts: this.reconnectionAttempts,
      listenersCount: this.listeners.size,
      currentPath: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
      lastCheckTime: this.lastCheckTime
    };
  }
}

// Exportar instancia singleton
export const connectionManager = new ConnectionManager();

// Hook para usar ConnectionManager en componentes React
import { useState, useEffect } from 'react';

export function useConnection() {
  const [connectionState, setConnectionState] = useState(() =>
    connectionManager.getConnectionState()
  );

  useEffect(() => {
    const unsubscribe = connectionManager.addListener((eventType, data) => {
      console.log(`🔔 Evento de conexión: ${eventType}`);

      setConnectionState({
        isOnline: data.isOnline,
        isTransitioning: data.isTransitioning || false,
        isPWA: connectionManager.isPWA,
        eventType,
        eventData: data
      });
    });

    // Actualizar estado inicial
    setConnectionState(connectionManager.getConnectionState());
    return unsubscribe;
  }, []);

  return {
    ...connectionState,
    forceCheck: connectionManager.forceConnectionCheck.bind(connectionManager),
    waitForConnection: connectionManager.waitForConnection.bind(connectionManager),
    checkOnDemand: connectionManager.checkConnectionOnDemand.bind(connectionManager)
  };
}