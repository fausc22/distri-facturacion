export const STOCK_THRESHOLDS = {
  SIN_STOCK: 0,
  CRITICO: 5,
  BAJO: 20,
  BAJO_LISTADO: 10
};

export const getStockStatus = (stock) => {
  const value = parseFloat(stock) || 0;

  if (value <= STOCK_THRESHOLDS.SIN_STOCK) {
    return { label: 'Sin stock', color: 'bg-red-100 text-red-800' };
  }
  if (value <= STOCK_THRESHOLDS.CRITICO) {
    return { label: 'Stock crítico', color: 'bg-orange-100 text-orange-800' };
  }
  if (value <= STOCK_THRESHOLDS.BAJO) {
    return { label: 'Stock bajo', color: 'bg-yellow-100 text-yellow-800' };
  }
  return { label: 'Stock normal', color: 'bg-green-100 text-green-800' };
};

export const isStockBajoListado = (stock) =>
  parseFloat(stock) < STOCK_THRESHOLDS.BAJO_LISTADO;
