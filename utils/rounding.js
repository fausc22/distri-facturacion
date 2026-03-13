/**
 * Utilidad de redondeo para importes de facturación (pedidos, ventas).
 * Regla acordada: decimales ,01 a ,59 mantienen el entero; ,60 a ,99 suben al siguiente.
 * Se aplica en: totales mostrados/editados en modal de facturación, y alinear con backend
 * en alta de pedido, venta directa, facturación pedido → venta.
 */

/**
 * Redondea un número con umbral 0.60 en la parte decimal.
 * - Parte decimal < 0.60 (ej: ,01 a ,59) → se mantiene el entero (trunca).
 * - Parte decimal >= 0.60 (ej: ,60 a ,99) → se sube al siguiente entero.
 *
 * @param {number} value - Valor a redondear (puede ser string numérico).
 * @returns {number} Entero redondeado según la regla.
 *
 * @example
 * roundFacturacion(10.59)  // 10
 * roundFacturacion(10.60)  // 11
 * roundFacturacion(10.99)  // 11
 * roundFacturacion(10.00)  // 10
 */
export function roundFacturacion(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  const entero = Math.floor(n);
  const decimal = n - entero;
  // Umbral 0.60: ,01-,59 bajan; ,60-,99 suben. Usar > 0.59 evita errores de punto flotante (ej. 10.6).
  return decimal > 0.59 ? entero + 1 : entero;
}

/**
 * Redondea varios importes (subtotal, iva, exento, total) con la misma regla.
 *
 * @param {object} importes - Objeto con propiedades numéricas.
 * @param {string[]} keys - Nombres de las propiedades a redondear.
 * @returns {object} Nuevo objeto con los mismos keys y valores redondeados.
 */
export function redondearImportes(importes, keys) {
  const out = {};
  for (const key of keys) {
    if (key in importes) {
      out[key] = roundFacturacion(importes[key]);
    }
  }
  return out;
}
