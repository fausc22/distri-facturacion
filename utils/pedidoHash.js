// utils/pedidoHash.js - Generación de hash único para detección de duplicados
// Función simple pero efectiva para generar hash determinístico de un pedido

/**
 * Genera un hash único determinístico de un pedido basado en su contenido
 * El mismo pedido siempre generará el mismo hash
 */
export function generarHashPedido(pedidoData) {
  try {
    // Normalizar datos para hash consistente
    const datosNormalizados = {
      cliente_id: pedidoData.cliente_id,
      subtotal: parseFloat(pedidoData.subtotal || 0).toFixed(2),
      iva_total: parseFloat(pedidoData.iva_total || 0).toFixed(2),
      total: parseFloat(pedidoData.total || 0).toFixed(2),
      empleado_id: pedidoData.empleado_id || 1,
      // Productos ordenados por ID para consistencia
      productos: (pedidoData.productos || []).map(p => ({
        id: p.id,
        cantidad: parseFloat(p.cantidad || 0),
        precio: parseFloat(p.precio || 0).toFixed(2),
        subtotal: parseFloat(p.subtotal || 0).toFixed(2)
      })).sort((a, b) => a.id - b.id)
    };

    // Crear string único del pedido
    const stringPedido = JSON.stringify(datosNormalizados);
    
    // Generar hash simple pero efectivo (no necesitamos crypto, solo consistencia)
    // Usar una función hash simple basada en el contenido
    let hash = 0;
    for (let i = 0; i < stringPedido.length; i++) {
      const char = stringPedido.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir a 32bit integer
    }
    
    // Convertir a string positivo y agregar timestamp del día (para permitir mismo pedido en días diferentes)
    const fechaHoy = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const hashFinal = `ped_${Math.abs(hash).toString(36)}_${fechaHoy.replace(/-/g, '')}`;
    
    return hashFinal;
  } catch (error) {
    console.error('❌ Error generando hash del pedido:', error);
    // Fallback: hash basado en timestamp y random (menos ideal pero funcional)
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

