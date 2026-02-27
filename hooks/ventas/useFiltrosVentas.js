// hooks/ventas/useFiltrosVentas.js
import { useState, useMemo } from 'react';

const FILTROS_INICIALES = {
  cliente: '',
  ciudad: '',
  tipoDocumento: '',
  tipoFiscal: '',
  empleado: '',
  fechaDesde: '',
  fechaHasta: ''
};

/**
 * Hook de estado de filtros para historial de ventas.
 * @param {Array} ventasOriginales - Lista de ventas (solo necesaria si se usa ventasFiltradas)
 * @param {Object} options - Opciones
 * @param {boolean} options.computeVentasFiltradas - Si true (por defecto), calcula ventasFiltradas en cliente.
 *   En la página Facturación el filtrado es en servidor, así que puede pasarse false para ahorrar trabajo.
 */
export function useFiltrosVentas(ventasOriginales = [], options = {}) {
  const { computeVentasFiltradas = true } = options;

  const [filtros, setFiltros] = useState(FILTROS_INICIALES);

  // Fase 4: solo calcular ventasFiltradas si se usa (ej. Facturación filtra en servidor y no lo necesita)
  const ventasFiltradas = useMemo(() => {
    if (!computeVentasFiltradas) return [];
    if (!ventasOriginales || ventasOriginales.length === 0) return [];

    return ventasOriginales.filter(venta => {
      if (filtros.cliente && !venta.cliente_nombre?.toLowerCase().includes(filtros.cliente.toLowerCase())) {
        return false;
      }
      if (filtros.ciudad && !venta.cliente_ciudad?.toLowerCase().includes(filtros.ciudad.toLowerCase())) {
        return false;
      }
      if (filtros.tipoDocumento && venta.tipo_doc !== filtros.tipoDocumento) {
        return false;
      }
      if (filtros.tipoFiscal && venta.tipo_f !== filtros.tipoFiscal) {
        return false;
      }
      if (filtros.empleado && venta.empleado_nombre !== filtros.empleado) {
        return false;
      }
      if (filtros.fechaDesde) {
        const fechaVenta = new Date(venta.fecha);
        const fechaDesde = new Date(filtros.fechaDesde);
        if (fechaVenta < fechaDesde) return false;
      }
      if (filtros.fechaHasta) {
        const fechaVenta = new Date(venta.fecha);
        const fechaHasta = new Date(filtros.fechaHasta);
        fechaHasta.setHours(23, 59, 59);
        if (fechaVenta > fechaHasta) return false;
      }
      return true;
    });
  }, [computeVentasFiltradas, ventasOriginales, filtros]);

  const handleFiltrosChange = (nuevosFiltros) => {
    setFiltros(nuevosFiltros);
  };

  const limpiarFiltros = () => {
    setFiltros({ ...FILTROS_INICIALES });
  };

  return {
    filtros,
    ventasFiltradas,
    handleFiltrosChange,
    limpiarFiltros
  };
}