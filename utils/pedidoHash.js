// utils/pedidoHash.js - Generación de hash idempotente para detección de duplicados
// OFFLINE-FIRST: Hash robusto que garantiza idempotencia total

/**
 * Genera un hash único determinístico e idempotente de un pedido
 * 
 * CARACTERÍSTICAS:
 * - El mismo pedido siempre genera el mismo hash
 * - Incluye fecha para permitir mismo pedido en días diferentes
 * - Incluye todos los campos críticos del pedido
 * - Ordena productos para consistencia
 * 
 * @param {Object} pedidoData - Datos del pedido
 * @returns {string} Hash único del pedido
 */
export function generarHashPedido(pedidoData) {
  try {
    // Normalizar y ordenar datos para hash consistente
    const datosNormalizados = {
      cliente_id: parseInt(pedidoData.cliente_id) || 0,
      empleado_id: parseInt(pedidoData.empleado_id) || 1,
      // Totales normalizados a 2 decimales
      subtotal: parseFloat(pedidoData.subtotal || 0).toFixed(2),
      iva_total: parseFloat(pedidoData.iva_total || 0).toFixed(2),
      total: parseFloat(pedidoData.total || 0).toFixed(2),
      // Productos normalizados y ordenados por ID para consistencia
      productos: (pedidoData.productos || [])
        .map(p => ({
          id: parseInt(p.id) || 0,
          cantidad: parseFloat(p.cantidad || 0),
          precio: parseFloat(p.precio || 0).toFixed(2),
          subtotal: parseFloat(p.subtotal || 0).toFixed(2),
          // Incluir descuento si existe
          descuento_porcentaje: parseFloat(p.descuento_porcentaje || 0).toFixed(2)
        }))
        .sort((a, b) => a.id - b.id) // Ordenar por ID para consistencia
    };

    // Agregar fecha del día (YYYY-MM-DD) para permitir mismo pedido en días diferentes
    const fechaHoy = new Date().toISOString().split('T')[0];
    datosNormalizados.fecha = fechaHoy;

    // Crear string único del pedido
    const stringPedido = JSON.stringify(datosNormalizados);
    
    // Generar hash determinístico usando función hash simple pero efectiva
    let hash = 0;
    for (let i = 0; i < stringPedido.length; i++) {
      const char = stringPedido.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir a 32bit integer
    }
    
    // Convertir a string positivo y agregar prefijo identificador
    const hashFinal = `ped_${Math.abs(hash).toString(36)}_${fechaHoy.replace(/-/g, '')}`;
    
    return hashFinal;
  } catch (error) {
    console.error('❌ [pedidoHash] Error generando hash del pedido:', error);
    // Fallback: hash basado en timestamp y random (NO ideal, pero funcional)
    // Este fallback solo se usa si hay error crítico en los datos
    return `ped_fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Genera hash para venta directa (similar a pedido)
 */
export function generarHashVenta(ventaData) {
  try {
    const datosNormalizados = {
      cliente_id: ventaData.cliente_id,
      subtotalSinIva: parseFloat(ventaData.subtotalSinIva || 0).toFixed(2),
      ivaTotal: parseFloat(ventaData.ivaTotal || 0).toFixed(2),
      totalConIva: parseFloat(ventaData.totalConIva || 0).toFixed(2),
      empleado_id: ventaData.empleado_id || 1,
      productos: (ventaData.productos || []).map(p => ({
        id: p.id,
        cantidad: parseFloat(p.cantidad || 0),
        precio: parseFloat(p.precio || 0).toFixed(2),
        subtotal: parseFloat(p.subtotal || 0).toFixed(2)
      })).sort((a, b) => a.id - b.id)
    };

    const stringVenta = JSON.stringify(datosNormalizados);
    let hash = 0;
    for (let i = 0; i < stringVenta.length; i++) {
      const char = stringVenta.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    const fechaHoy = new Date().toISOString().split('T')[0];
    const hashFinal = `venta_${Math.abs(hash).toString(36)}_${fechaHoy.replace(/-/g, '')}`;
    
    return hashFinal;
  } catch (error) {
    console.error('❌ Error generando hash de venta:', error);
    return `venta_fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

