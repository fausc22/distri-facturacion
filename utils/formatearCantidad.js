/**
 * Formatea cantidades para UI:
 * - "30.0" -> "30"
 * - "30.5" -> "30.5"
 * - "92.10" -> "92.1"
 */
export const formatearCantidad = (valor) => {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return '0';

  const conPrecision = numero.toFixed(3);
  return conPrecision.replace(/\.?0+$/, '');
};

