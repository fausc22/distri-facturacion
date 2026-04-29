/**
 * Utilidad de redondeo para importes de facturación (pedidos, ventas).
 * Regla acordada: redondeo estándar (>= 0.50 sube, < 0.50 baja).
 * Se aplica en: totales mostrados/editados en modal de facturación, y alinear con backend
 * en alta de pedido, venta directa, facturación pedido → venta.
 */

/**
 * Redondea un número con criterio estándar.
 * - Parte decimal < 0.50 → baja al entero inferior.
 * - Parte decimal >= 0.50 → sube al siguiente entero.
 *
 * @param {number} value - Valor a redondear (puede ser string numérico).
 * @returns {number} Entero redondeado según la regla.
 *
 * @example
 * roundFacturacion(10.49)  // 10
 * roundFacturacion(10.50)  // 11
 * roundFacturacion(10.99)  // 11
 * roundFacturacion(10.00)  // 10
 */
export function roundFacturacion(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n);
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
