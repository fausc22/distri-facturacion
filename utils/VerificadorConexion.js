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
 * ⚠️ MEJORADO: Acepta cualquier respuesta HTTP válida (200-599)
 * Cualquier respuesta del servidor indica que hay conectividad de red
 * Solo errores de red (fetch fallido, timeout) indican offline
 * 
 * @param {number} timeout - Timeout en ms (default: 5s para sincronización)
 * @param {number} reintentos - Número de reintentos (default: 1)
 * @returns {Promise<boolean>} - true si hay conexión real, false si no
 */
export async function verificarConexionReal(timeout = 5000, reintentos = 1) {
  // Si navigator.onLine es false, aún intentar verificar (Safari puede mentir)
  if (typeof window === 'undefined') {
    return false;
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  if (!apiUrl) {
    console.warn('⚠️ [VerificadorConexion] NEXT_PUBLIC_API_URL no configurado');
    return false;
  }

  // Intentar con reintentos
  for (let intento = 0; intento <= reintentos; intento++) {
    try {
      if (intento > 0) {
        console.log(`🔄 [VerificadorConexion] Reintento ${intento}/${reintentos}...`);
        // Esperar un poco antes de reintentar
        await new Promise(resolve => setTimeout(resolve, 1000 * intento));
      }

      console.log(`🔍 [VerificadorConexion] Verificando conexión real con backend (intento ${intento + 1}/${reintentos + 1})...`);
      
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
      
      // ⚠️ MEJORADO: Cualquier respuesta HTTP (200-599) significa que hay conectividad
      // Solo fetch fallido o timeout significa OFFLINE
      // Esto es más permisivo y evita falsos negativos
      const tieneConexion = response.status >= 200 && response.status < 600;
      
      if (tieneConexion) {
        if (response.status >= 200 && response.status < 300) {
          console.log('✅ [VerificadorConexion] Conexión real confirmada (status OK)');
        } else {
          console.log(`✅ [VerificadorConexion] Conexión real confirmada (status ${response.status} - servidor responde)`);
        }
        return true;
      }
      
    } catch (error) {
      // Solo errores de red (fetch fallido, timeout) se consideran OFFLINE
      if (error.name === 'AbortError') {
        console.log(`⏱️ [VerificadorConexion] Timeout después de ${timeout}ms (intento ${intento + 1})`);
        if (intento < reintentos) continue; // Reintentar
      } else {
        console.log(`❌ [VerificadorConexion] Error verificando conexión (intento ${intento + 1}): ${error.name} - ${error.message}`);
        if (intento < reintentos) continue; // Reintentar
      }
      
      // Si es el último intento, retornar false
      if (intento === reintentos) {
        console.log(`❌ [VerificadorConexion] Todos los intentos fallaron - Sin conexión`);
        return false;
      }
    }
  }
  
  return false;
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
