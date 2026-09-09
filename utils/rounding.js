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

/**
 * Redondeo para precios de catálogo (2 decimales).
 * No usar roundFacturacion aquí — esa regla es para totales de facturación.
 */
export function roundPrecio(value, decimals = 2) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}

export function precioNetoDesdeConIva(precioConIva, porcentajeIva) {
  const iva = Number(porcentajeIva);
  if (!Number.isFinite(iva) || iva < 0) return roundPrecio(precioConIva);
  return roundPrecio(Number(precioConIva) / (1 + iva / 100), 4);
}

export function precioConIvaDesdeNeto(precioNeto, porcentajeIva) {
  const iva = Number(porcentajeIva);
  if (!Number.isFinite(iva) || iva < 0) return roundPrecio(precioNeto);
  return roundPrecio(Number(precioNeto) * (1 + iva / 100));
}

/**
 * Resuelve una alícuota de IVA. 0% es un valor válido: no usar `|| 21`.
 * @param {unknown} value
 * @param {number} [fallback=21]
 * @returns {number}
 */
export function resolvePorcentajeIva(value, fallback = 21) {
  if (value === null || value === undefined || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/**
 * Lee la alícuota de un producto de catálogo o de una línea de carrito.
 * Prefiere `porcentaje_iva` (tasa de la línea) y, si no está, `iva` (tasa de catálogo).
 */
export function obtenerPorcentajeIva(producto, fallback = 21) {
  return resolvePorcentajeIva(producto?.porcentaje_iva ?? producto?.iva, fallback);
}
