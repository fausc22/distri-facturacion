export const formatearMoneda = (monto) => {
  const num = Number(monto ?? 0);
  if (Number.isNaN(num)) return '$0,00';

  return `$${num.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};
