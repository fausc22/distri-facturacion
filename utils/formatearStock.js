/**
 * Formatea el stock para mostrarlo:
 * - Si es entero (80.0, 80) -> muestra "80"
 * - Si tiene decimales (79.5) -> muestra "79.5"
 */
export const formatearStock = (stock) => {
  const stockNum = parseFloat(stock);
  if (isNaN(stockNum)) return '0';
  
  // Si el número es entero (sin decimales), mostrar sin decimales
  if (stockNum % 1 === 0) {
    return stockNum.toString();
  }
  
  // Si tiene decimales, mostrar con 1 decimal
  return stockNum.toFixed(1);
};

