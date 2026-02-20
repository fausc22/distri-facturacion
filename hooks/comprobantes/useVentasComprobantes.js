// hooks/comprobantes/useVentasComprobantes.js
import { useState, useEffect, useMemo } from 'react';
import { axiosAuth } from '../../utils/apiClient';
import { toast } from 'react-hot-toast';
import { usePaginacion } from '../usePaginacion';
//arrancar con el hook usePaginacion
export const useVentasComprobantes = () => {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtros, setFiltros] = useState({
    estado: 'todos', // todos, con, sin
    fechaDesde: '',
    fechaHasta: '',
    montoMin: '',
    montoMax: ''
  });

  // Cargar datos iniciales
  useEffect(() => {
    cargarVentas();
  }, []);

  const cargarVentas = async () => {
    try {
      setLoading(true);

      const response = await axiosAuth.get('/ventas/obtener-ventas', {
        params: { pagina: 1, porPagina: 200 }
      });

      const rawData = response.data?.data ?? (Array.isArray(response.data) ? response.data : []);
      if (response.data && (response.data.success || Array.isArray(response.data))) {
        const ventasProcesadas = rawData.map(venta => ({
          ...venta,
          // Usar el campo calculado del backend que verifica archivo físico
          tieneComprobante: venta.tieneComprobante || venta.archivoExiste || !!venta.comprobante_path,
          fechaFormateada: formatearFecha(venta.fecha),
          montoFormateado: formatearMonto(venta.total)
        }));

        setVentas(ventasProcesadas);
      } else {
        setVentas([]);
        toast.error('Error en el formato de datos recibidos');
      }
    } catch (error) {
      console.error('❌ Error cargando ventas:', error);
      setVentas([]);
      
      if (error.response?.status === 401) {
        toast.error('Sesión expirada. Inicie sesión nuevamente.');
      } else {
        toast.error('Error al cargar las ventas. Intente nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Función mejorada para refrescar una venta específica
  const refrescarVentaEspecifica = async (ventaId) => {
    try {
      console.log(`🔄 Refrescando venta específica: ${ventaId}`);
      
      const response = await axiosAuth.get(`/ventas/obtener-venta/${ventaId}`);
      
      if (response.data && response.data.length > 0) {
        const ventaActualizada = response.data[0];
        
        // ✅ También verificar el comprobante físicamente
        let tieneComprobanteReal = false;
        if (ventaActualizada.comprobante_path) {
          try {
            const verificacionResponse = await axiosAuth.get(`/comprobantes/verificar/venta/${ventaId}`);
            tieneComprobanteReal = verificacionResponse.data?.data?.archivoExiste || false;
          } catch (verifyError) {
            console.warn('No se pudo verificar archivo, usando valor de BD:', verifyError);
            tieneComprobanteReal = !!ventaActualizada.comprobante_path;
          }
        }
        
        // Actualizar solo esa venta en el estado
        setVentas(prevVentas => 
          prevVentas.map(venta => 
            venta.id === ventaId 
              ? {
                  ...ventaActualizada,
                  tieneComprobante: tieneComprobanteReal,
                  archivoExiste: tieneComprobanteReal,
                  comprobanteEnBD: !!ventaActualizada.comprobante_path,
                  fechaFormateada: formatearFecha(ventaActualizada.fecha),
                  montoFormateado: formatearMonto(ventaActualizada.total)
                }
              : venta
          )
        );
        
        console.log(`✅ Venta ${ventaId} actualizada - Comprobante: ${tieneComprobanteReal} (BD: ${!!ventaActualizada.comprobante_path})`);
      }
    } catch (error) {
      console.error(`❌ Error refrescando venta ${ventaId}:`, error);
      // Fallback: recargar todas las ventas
      await cargarVentas();
    }
  };

  // Verificar si hay filtros activos
  const hayFiltrosActivos = () => {
    return searchTerm || 
           filtros.estado !== 'todos' || 
           filtros.fechaDesde || 
           filtros.fechaHasta || 
           filtros.montoMin || 
           filtros.montoMax;
  };

  // Filtrado de ventas en tiempo real
  const ventasFiltradas = useMemo(() => {
    const ventasFiltradas = ventas.filter(venta => {
      // Filtro de búsqueda por cliente o ID
      const matchesSearch = 
        !searchTerm ||
        venta.cliente_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        venta.id?.toString().includes(searchTerm) ||
        venta.cliente_telefono?.includes(searchTerm);

      // Filtro por estado de comprobante
      const matchesEstado = 
        filtros.estado === 'todos' ||
        (filtros.estado === 'con' && venta.tieneComprobante) ||
        (filtros.estado === 'sin' && !venta.tieneComprobante);

      // Filtro por fecha
      const matchesFecha = 
        (!filtros.fechaDesde || new Date(venta.fecha) >= new Date(filtros.fechaDesde)) &&
        (!filtros.fechaHasta || new Date(venta.fecha) <= new Date(filtros.fechaHasta + 'T23:59:59'));

      // Filtro por monto
      const montoVenta = parseFloat(venta.total) || 0;
      const matchesMonto = 
        (!filtros.montoMin || montoVenta >= parseFloat(filtros.montoMin)) &&
        (!filtros.montoMax || montoVenta <= parseFloat(filtros.montoMax));

      return matchesSearch && matchesEstado && matchesFecha && matchesMonto;
    });

    // Si hay filtros activos, mostrar todos los resultados
    // Si no hay filtros, mostrar solo los primeros 20
    return hayFiltrosActivos() ? ventasFiltradas : ventasFiltradas.slice(0, 20);
  }, [ventas, searchTerm, filtros]);

  // Estadísticas calculadas (simplificadas)
  const estadisticas = useMemo(() => {
    const total = ventas.length;
    const conComprobante = ventas.filter(v => v.tieneComprobante).length;
    const sinComprobante = total - conComprobante;

    return {
      totalVentas: total,
      ventasConComprobante: conComprobante,
      ventasSinComprobante: sinComprobante
    };
  }, [ventas]);

  // Handlers
  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const limpiarFiltros = () => {
    setSearchTerm('');
    setFiltros({
      estado: 'todos',
      fechaDesde: '',
      fechaHasta: '',
      montoMin: '',
      montoMax: ''
    });
  };

  const refrescarDatos = () => {
    cargarVentas();
  };

  return {
    // Datos
    ventas,
    ventasFiltradas,
    loading,
    
    // Estados de filtros
    searchTerm,
    filtros,
    
    // Funciones de utilidad
    hayFiltrosActivos,
    
    // Handlers
    handleSearch,
    handleFiltroChange,
    limpiarFiltros,
    refrescarDatos,
    refrescarVentaEspecifica  // ✅ Nueva función
  };
};

// Funciones helper
const formatearFecha = (fecha) => {
  if (!fecha) return 'Sin fecha';
  
  try {
    const fechaObj = new Date(fecha);
    if (isNaN(fechaObj.getTime())) return 'Fecha inválida';
    
    return fechaObj.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Error en fecha';
  }
};

const formatearMonto = (monto) => {
  if (!monto) return '$0,00';
  
  try {
    const numeroMonto = parseFloat(monto);
    if (isNaN(numeroMonto)) return '$0,00';
    
    return numeroMonto.toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  } catch (error) {
    return '$0,00';
  }
};