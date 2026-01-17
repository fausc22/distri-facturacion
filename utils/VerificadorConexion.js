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
 * ⚠️ CONSERVADOR: Mejor asumir offline que romper el flujo
 * En Safari iOS, navigator.onLine puede mentir, así que verificamos realmente
 * 
 * @param {number} timeout - Timeout en ms (default: 3s - más corto para ser conservador)
 * @returns {Promise<boolean>} - true si hay conexión real, false si no
 */
export async function verificarConexionReal(timeout = 3000) {
  // Si navigator.onLine es false, asumir offline (conservador)
  if (typeof window === 'undefined' || !navigator.onLine) {
    console.log('📴 [VerificadorConexion] navigator.onLine = false, asumiendo offline (conservador)');
    return false;
  }

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    if (!apiUrl) {
      console.warn('⚠️ [VerificadorConexion] NEXT_PUBLIC_API_URL no configurado, asumiendo offline');
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
    
    // ⚠️ CONSERVADOR: Solo considerar ONLINE si respuesta es 200-299
    // 300-599 pueden ser errores que indican problemas de conectividad
    const tieneConexion = response.status >= 200 && response.status < 300;
    
    if (tieneConexion) {
      console.log('✅ [VerificadorConexion] Conexión real confirmada');
    } else {
      // Respuesta fuera de rango exitoso - asumir offline (conservador)
      console.log(`⚠️ [VerificadorConexion] Backend responde con status ${response.status} - Asumiendo offline (conservador)`);
      return false;
    }
    
    return tieneConexion;
    
  } catch (error) {
    // Cualquier error (fetch fallido, timeout, etc.) se considera OFFLINE (conservador)
    if (error.name === 'AbortError') {
      console.log(`⏱️ [VerificadorConexion] Timeout después de ${timeout}ms - Asumiendo offline (conservador)`);
    } else {
      console.log(`❌ [VerificadorConexion] Error verificando conexión: ${error.name} - Asumiendo offline (conservador)`);
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
