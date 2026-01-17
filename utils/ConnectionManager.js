// utils/ConnectionManager.js - OFFLINE-FIRST: Completamente pasivo, sin auto-reconexión
import { getAppMode } from './offlineManager';

/**
 * ConnectionManager - Gestor de conectividad completamente pasivo
 * 
 * PRINCIPIOS:
 * - Solo detecta y notifica cambios de estado
 * - NUNCA dispara acciones automáticas
 * - NUNCA intenta reconectar automáticamente
 * - Los componentes deciden cuándo verificar conexión
 * 
 * Uso: Los componentes deben llamar checkConnectionOnDemand() cuando necesiten
 * verificar conexión real (al guardar pedido, al volver al menú, etc.)
 */
class ConnectionManager {
  constructor() {
    this.isOnline = typeof window !== 'undefined' ? navigator.onLine : true;
    this.listeners = new Set();
    this.isTransitioning = false;
    this.isPWA = getAppMode() === 'pwa';
    
    // Solo inicializar en cliente
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  init() {
    console.log('🔌 [ConnectionManager] Iniciado - Modo OFFLINE-FIRST (completamente pasivo)');
    
    // Listeners nativos del navegador - SOLO para actualizar estado interno
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Estado inicial
    this.isOnline = navigator.onLine;
    console.log(`🌐 [ConnectionManager] Estado inicial: ${this.isOnline ? 'ONLINE' : 'OFFLINE'}`);
  }

  /**
   * Maneja evento online del navegador
   * Solo actualiza estado interno y notifica listeners
   * NO dispara ninguna acción automática
   */
  handleOnline() {
    const wasOnline = this.isOnline;
    this.isOnline = true;
    
    if (!wasOnline) {
      console.log('🌐 [ConnectionManager] Evento ONLINE detectado - Solo actualizando estado');
      this.notifyListeners('connection_restored', {
        isOnline: true,
        message: 'Conexión detectada',
        silent: true,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Maneja evento offline del navegador
   * Solo actualiza estado interno y notifica listeners
   * NO dispara ninguna acción automática
   */
  handleOffline() {
    const wasOnline = this.isOnline;
    this.isOnline = false;
    
    if (wasOnline) {
      console.log('📴 [ConnectionManager] Evento OFFLINE detectado - Solo actualizando estado');
      this.notifyListeners('connection_lost', {
        isOnline: false,
        message: 'Conexión perdida',
        silent: true,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Verificación de conexión REAL bajo demanda
   * 
   * Esta es la ÚNICA forma de verificar conexión real (no solo navigator.onLine)
   * Debe ser llamada explícitamente por los componentes cuando necesiten verificar
   * 
   * @param {number} timeout - Timeout en ms (default: 5s)
   * @returns {Promise<boolean>} - true si hay conexión real, false si no
   */
  async checkConnectionOnDemand(timeout = 5000) {
    console.log('🔍 [ConnectionManager] Verificación de conexión REAL bajo demanda...');
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      // Usar /ping (liviano) - cualquier respuesta HTTP significa conectividad
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${apiUrl}/ping`, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      // Cualquier respuesta HTTP (200-599) significa que hay conectividad
      // Solo fetch fallido o timeout significa OFFLINE
      const hasConnection = response.status >= 200 && response.status < 600;
      
      // Actualizar estado interno
      const wasOnline = this.isOnline;
      this.isOnline = hasConnection;
      
      if (hasConnection) {
        if (response.status >= 500) {
          console.warn(`⚠️ [ConnectionManager] Backend responde con error ${response.status} - Considerado ONLINE`);
        } else {
          console.log(`✅ [ConnectionManager] Verificación exitosa: ONLINE`);
        }
      }
      
      // NO disparar eventos automáticos - el componente maneja el resultado
      return hasConnection;
      
    } catch (error) {
      // Solo errores de red (fetch fallido, timeout) se consideran OFFLINE
      console.log(`❌ [ConnectionManager] Verificación falló (sin conectividad): ${error.name} - ${error.message}`);
      this.isOnline = false;
      return false;
    }
  }

  /**
   * Sistema de listeners para que componentes se suscriban a cambios
   * Los listeners reciben eventos pero NO deben disparar acciones automáticas
   */
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
        console.error('❌ [ConnectionManager] Error notificando listener:', error);
      }
    });
  }

  /**
   * Obtiene el estado actual de conexión
   * @returns {Object} Estado de conexión
   */
  getConnectionState() {
    return {
      isOnline: this.isOnline,
      isPWA: this.isPWA,
      timestamp: Date.now()
    };
  }

  /**
   * Alias para checkConnectionOnDemand (compatibilidad)
   */
  async forceConnectionCheck() {
    return await this.checkConnectionOnDemand();
  }

  /**
   * Limpia recursos del ConnectionManager
   */
  destroy() {
    console.log('🧹 [ConnectionManager] Destruyendo...');
    
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline.bind(this));
      window.removeEventListener('offline', this.handleOffline.bind(this));
    }
    
    this.listeners.clear();
  }

  /**
   * Información de debug
   */
  getDebugInfo() {
    return {
      isOnline: this.isOnline,
      isPWA: this.isPWA,
      listenersCount: this.listeners.size,
      currentPath: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
      mode: 'OFFLINE_FIRST_PASSIVE'
    };
  }
}

// Exportar instancia singleton
export const connectionManager = new ConnectionManager();

// Hook para componentes React - Solo estado, sin acciones automáticas
import { useState, useEffect } from 'react';

/**
 * Hook useConnection - Proporciona estado de conexión a componentes
 * 
 * IMPORTANTE: Este hook solo proporciona estado, NO dispara acciones automáticas
 * Los componentes deben decidir cuándo verificar conexión usando checkOnDemand()
 */
export function useConnection() {
  const [connectionState, setConnectionState] = useState(() => 
    connectionManager.getConnectionState()
  );

  useEffect(() => {
    const unsubscribe = connectionManager.addListener((eventType, data) => {
      // Solo actualizar estado, NO disparar acciones
      setConnectionState({
        isOnline: data.isOnline,
        isPWA: data.isPWA || false,
        eventType,
        eventData: data,
        timestamp: data.timestamp || Date.now()
      });
    });

    // Estado inicial
    setConnectionState(connectionManager.getConnectionState());
    
    return unsubscribe;
  }, []);

  return {
    ...connectionState,
    // Métodos para verificación bajo demanda (los componentes deciden cuándo llamar)
    checkOnDemand: connectionManager.checkConnectionOnDemand.bind(connectionManager),
    forceCheck: connectionManager.forceConnectionCheck.bind(connectionManager)
  };
}