// utils/VerificadorConexion.js - Verificación real de conexión para entornos inestables
// OFFLINE-FIRST: Verificación robusta que no depende solo de navigator.onLine

/**
 * VerificadorConexion - Verifica conexión REAL con el backend
 * 
 * IMPORTANTE: navigator.onLine puede ser engañoso en conexiones inestables
 * Esta función hace una petición real al backend para confirmar conectividad
 * 
 * USO:
 * - Antes de intentar registrar pedido online
 * - Antes de sincronizar pedidos pendientes
 * - Al volver al menú principal
 * 
 * NO usar:
 * - Durante el flujo de edición de pedido
 * - Automáticamente al detectar eventos online/offline
 */

/**
 * Verifica si hay conexión REAL con el backend
 * 
 * @param {number} timeout - Timeout en ms (default: 5s)
 * @returns {Promise<boolean>} - true si hay conexión real, false si no
 */
export async function verificarConexionReal(timeout = 5000) {
  // Si navigator.onLine es false, no tiene sentido verificar
  if (typeof window === 'undefined' || !navigator.onLine) {
    console.log('📴 [VerificadorConexion] navigator.onLine = false, sin verificar');
    return false;
  }

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    if (!apiUrl) {
      console.warn('⚠️ [VerificadorConexion] NEXT_PUBLIC_API_URL no configurado');
      return false;
    }

    console.log('🔍 [VerificadorConexion] Verificando conexión real con backend...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    // Usar /ping (endpoint liviano) - cualquier respuesta HTTP significa conectividad
    const response = await fetch(`${apiUrl}/ping`, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    clearTimeout(timeoutId);
    
    // Cualquier respuesta HTTP (200-599) significa que hay conectividad
    // Solo fetch fallido o timeout significa OFFLINE
    const tieneConexion = response.status >= 200 && response.status < 600;
    
    if (tieneConexion) {
      if (response.status >= 500) {
        console.warn(`⚠️ [VerificadorConexion] Backend responde con error ${response.status} - Considerado ONLINE`);
      } else {
        console.log('✅ [VerificadorConexion] Conexión real confirmada');
      }
    } else {
      console.log('❌ [VerificadorConexion] Backend no responde correctamente');
    }
    
    return tieneConexion;
    
  } catch (error) {
    // Solo errores de red (fetch fallido, timeout) se consideran OFFLINE
    if (error.name === 'AbortError') {
      console.log(`⏱️ [VerificadorConexion] Timeout después de ${timeout}ms - Sin conexión`);
    } else {
      console.log(`❌ [VerificadorConexion] Error verificando conexión: ${error.name} - ${error.message}`);
    }
    return false;
  }
}

/**
 * Verifica conexión con timeout más largo (útil para conexiones lentas)
 * 
 * @param {number} timeout - Timeout en ms (default: 10s)
 * @returns {Promise<boolean>} - true si hay conexión real, false si no
 */
export async function verificarConexionRealLenta(timeout = 10000) {
  return await verificarConexionReal(timeout);
}
