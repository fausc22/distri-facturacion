// hooks/notas/useNotas.js
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { axiosAuth } from '../../utils/apiClient';

export function useNotas() {
  const [loading, setLoading] = useState(false);

  // Buscar ventas para referencia
  const buscarVentas = async (query) => {
    if (!query || query.trim().length < 2) {
      return [];
    }

    try {
      const response = await axiosAuth.get(`/notas/buscar-ventas?q=${encodeURIComponent(query)}`);
      return response.data.success ? response.data.data : [];
    } catch (error) {
      console.error('Error buscando ventas:', error);
      toast.error('Error al buscar ventas');
      return [];
    }
  };

  // Crear nota de débito o crédito
  const crearNota = async (tipoNota, datosNota) => {
    const { cliente, ventaReferencia, productos, observaciones, empleado } = datosNota;

    if (!productos || productos.length === 0) {
      toast.error('Debe agregar al menos un producto');
      return { success: false };
    }

    // Si no hay venta de referencia, debe haber cliente
    if (!ventaReferencia && !cliente) {
      toast.error('Debe seleccionar una venta de referencia o un cliente');
      return { success: false };
    }

    // Calcular totales
    const subtotal = productos.reduce((acc, prod) => acc + prod.subtotal, 0);
    const totalIva = productos.reduce((acc, prod) => acc + prod.iva_calculado, 0);
    const total = subtotal + totalIva;
    
    // Calcular monto exento
    const esClienteExento = cliente?.condicion_iva?.toUpperCase() === 'EXENTO';
    let montoExento = 0;
    
    if (esClienteExento && productos && productos.length > 0) {
      montoExento = productos.reduce((acc, prod) => {
        const porcentajeIva = prod.porcentaje_iva || 21;
        const subtotal = parseFloat(prod.subtotal) || 0;
        const ivaQueDeberiaCobrarse = parseFloat((subtotal * (porcentajeIva / 100)).toFixed(2));
        return acc + ivaQueDeberiaCobrarse;
      }, 0);
    }

    // Preparar datos de la nota
    const notaData = {
      tipoNota, // 'NOTA_DEBITO' o 'NOTA_CREDITO'
      ventaReferenciaId: ventaReferencia?.id || null,
      cliente_id: cliente?.id || null,
      cliente_nombre: cliente?.nombre || ventaReferencia?.cliente_nombre || '',
      cliente_telefono: cliente?.telefono || ventaReferencia?.cliente_telefono || '',
      cliente_direccion: cliente?.direccion || ventaReferencia?.cliente_direccion || '',
      cliente_ciudad: cliente?.ciudad || ventaReferencia?.cliente_ciudad || '',
      cliente_provincia: cliente?.provincia || ventaReferencia?.cliente_provincia || '',
      cliente_condicion: cliente?.condicion_iva || ventaReferencia?.cliente_condicion || '',
      cliente_cuit: cliente?.cuit || ventaReferencia?.cliente_cuit || '',
      cuentaId: datosNota.cuentaId || 1,
      tipoFiscal: datosNota.tipoFiscal || 'B',
      subtotalSinIva: subtotal.toFixed(2),
      ivaTotal: totalIva.toFixed(2),
      exento: montoExento > 0 ? montoExento.toFixed(2) : '0.00',
      totalConIva: total.toFixed(2),
      observaciones: observaciones || 'sin observaciones',
      empleado_id: empleado?.id || 1,
      empleado_nombre: empleado?.nombre || 'Usuario',
      productos: productos.map(p => ({
        id: p.id,
        nombre: p.nombre,
        unidad_medida: p.unidad_medida || 'Unidad',
        cantidad: p.cantidad,
        precio: parseFloat(p.precio),
        iva: parseFloat(p.iva_calculado),
        subtotal: parseFloat(p.subtotal),
        porcentaje_iva: p.porcentaje_iva || 21,
        esManual: p.esManual || false
      }))
    };

    setLoading(true);

    try {
      console.log(`🔍 Datos de ${tipoNota} a enviar:`, notaData);
      
      const response = await axiosAuth.post(`/notas/crear-nota`, notaData);
      
      if (response.data.success) {
        toast.success(`${tipoNota === 'NOTA_DEBITO' ? 'Nota de Débito' : 'Nota de Crédito'} creada exitosamente`);
        return { success: true, notaId: response.data.data.notaId };
      } else {
        toast.error(response.data.message || `Error al crear ${tipoNota}`);
        return { success: false, error: response.data.message };
      }
    } catch (error) {
      console.error(`Error al crear ${tipoNota}:`, error);
      toast.error(`Error al crear ${tipoNota === 'NOTA_DEBITO' ? 'la nota de débito' : 'la nota de crédito'}`);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    buscarVentas,
    crearNota
  };
}

