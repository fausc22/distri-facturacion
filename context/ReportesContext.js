// context/ReportesContext.js — bridge v2: UI state en Zustand, datos en context
import { createContext, useContext, useReducer } from 'react';
import { useReportesUIStore } from '@/stores/reportesUIStore';
import { useReportes } from '../hooks/useReportes';
import { useFinanzasData } from '../hooks/useFinanzasData';

const ReportesContext = createContext();

// Reducer para manejar el estado de reportes
function reportesReducer(state, action) {
  switch (action.type) {
    case 'SET_DATA':
      return {
        ...state,
        data: {
          ...state.data,
          [action.payload.key]: action.payload.data
        }
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.loading
        }
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    
    case 'SET_DASHBOARD_DATA':
      return {
        ...state,
        dashboardData: action.payload,
        lastUpdate: Date.now()
      };
    
    case 'REFRESH_DATA':
      return {
        ...state,
        refreshing: true,
        lastRefresh: Date.now()
      };
    
    case 'REFRESH_COMPLETE':
      return {
        ...state,
        refreshing: false,
        lastUpdate: Date.now()
      };
    
    default:
      return state;
  }
}

const initialState = {
  data: {
    resumenFinanciero: null,
    gananciasDetalladas: null,
    gananciasPorProducto: null,
    gananciasPorEmpleado: null,
    gananciasPorCiudad: null,
    productosMasRentables: null,
    productosMasVendidos: null,
    balanceGeneral: null,
    balancePorCuenta: null,
    flujoDeFondos: null,
    ventasPorVendedor: null,
    distribucionIngresos: null,
    gastosPorCategoria: null,
    aniosDisponibles: null
  },
  dashboardData: null,
  loading: {},
  error: null,
  refreshing: false,
  lastUpdate: null,
  lastRefresh: null
};

export function ReportesProvider({ children }) {
  const [state, dispatch] = useReducer(reportesReducer, initialState);
  
  // Hooks personalizados
  const reportesConfig = useReportes();
  const finanzasApi = useFinanzasData();

  // ✅ FUNCIÓN CORREGIDA: Validar y preparar filtros
  const prepararFiltros = (filtrosCustom = {}) => {
    // Combinar filtros del contexto con personalizados
    const filtrosBase = { ...reportesConfig.filtros, ...filtrosCustom };
    
    console.log('🔍 Preparando filtros base:', filtrosBase);
    
    // ✅ VALIDACIÓN Y VALORES POR DEFECTO
    const ahora = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(ahora.getDate() - 30);
    
    const filtrosValidados = {
      ...filtrosBase,
      // ✅ Asegurar que siempre tengamos fechas válidas
      desde: filtrosBase.desde || hace30Dias.toISOString().split('T')[0],
      hasta: filtrosBase.hasta || ahora.toISOString().split('T')[0],
      periodo: filtrosBase.periodo || 'mensual',
      limite: filtrosBase.limite || 20
    };
    
    console.log('✅ Filtros validados:', filtrosValidados);
    
    return filtrosValidados;
  };

  // ✅ FUNCIÓN CORREGIDA: cargar datos específicos con validación
  const cargarDatos = async (tipoReporte, filtrosCustom = {}) => {
    dispatch({ type: 'SET_LOADING', payload: { key: tipoReporte, loading: true } });
    dispatch({ type: 'CLEAR_ERROR' });

    try {
      // ✅ Preparar filtros validados
      const filtros = prepararFiltros(filtrosCustom);
      
      console.log(`📊 Cargando ${tipoReporte} con filtros:`, filtros);
      
      let resultado;

      switch (tipoReporte) {
        // ✅ CASOS PRINCIPALES CON VALIDACIÓN DE FECHAS
        case 'resumenFinanciero':
          resultado = await finanzasApi.obtenerResumenFinanciero(filtros);
          break;
          
        case 'gananciasDetalladas':
          // ✅ VALIDACIÓN ESPECÍFICA para ganancias detalladas
          if (!filtros.desde || !filtros.hasta) {
            throw new Error('Las fechas desde y hasta son obligatorias para ganancias detalladas');
          }
          resultado = await finanzasApi.obtenerGananciasDetalladas(filtros);
          break;
          
        case 'gananciasPorProducto':
          resultado = await finanzasApi.obtenerGananciasPorProducto(filtros);
          break;
          
        case 'gananciasPorEmpleado':
          resultado = await finanzasApi.obtenerGananciasPorEmpleado(filtros);
          break;
          
        case 'gananciasPorCiudad':
          resultado = await finanzasApi.obtenerGananciasPorCiudad(filtros);
          break;
          
        case 'productosMasRentables':
          resultado = await finanzasApi.obtenerProductosMasRentables(filtros);
          break;
          
        case 'productosMasVendidos':
          resultado = await finanzasApi.obtenerProductosMasVendidos(filtros);
          break;
          
        case 'balanceGeneral':
          resultado = await finanzasApi.obtenerBalanceGeneral(filtros);
          break;
        
        // ✅ CASOS NUEVOS
        case 'balancePorCuenta':
          resultado = await finanzasApi.obtenerBalancePorCuenta(filtros);
          break;
          
        case 'flujoDeFondos':
          resultado = await finanzasApi.obtenerFlujoDeFondos(filtros);
          break;
          
        case 'ventasPorVendedor':
          resultado = await finanzasApi.obtenerVentasPorVendedor(filtros);
          break;
          
        case 'distribucionIngresos':
          resultado = await finanzasApi.obtenerDistribucionIngresos(filtros);
          break;
          
        case 'gastosPorCategoria':
          resultado = await finanzasApi.obtenerGastosPorCategoria(filtros);
          break;
          
        case 'aniosDisponibles':
          resultado = await finanzasApi.obtenerAniosDisponibles();
          break;
        
        default:
          throw new Error(`Tipo de reporte no reconocido: ${tipoReporte}`);
      }

      if (resultado.success) {
        dispatch({
          type: 'SET_DATA',
          payload: { key: tipoReporte, data: resultado }
        });
        console.log(`✅ Datos cargados para ${tipoReporte}:`, resultado.data?.length || 'N/A', 'registros');
      } else {
        dispatch({ type: 'SET_ERROR', payload: resultado.error });
        console.error(`❌ Error en ${tipoReporte}:`, resultado.error);
      }

      return resultado;

    } catch (error) {
      const errorMsg = error.message || 'Error cargando datos';
      console.error(`💥 Error en cargarDatos(${tipoReporte}):`, errorMsg);
      dispatch({ type: 'SET_ERROR', payload: errorMsg });
      return { success: false, error: errorMsg };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: tipoReporte, loading: false } });
    }
  };

  // ✅ FUNCIÓN CORREGIDA: cargar dashboard completo
  const cargarDashboard = async (filtrosCustom = {}) => {
    dispatch({ type: 'REFRESH_DATA' });

    try {
      // ✅ Preparar filtros validados para dashboard
      const filtros = prepararFiltros(filtrosCustom);
      
      console.log('🚀 Iniciando carga de dashboard con filtros:', filtros);
      
      // ✅ Verificar que tenemos fechas válidas antes de continuar
      if (!filtros.desde || !filtros.hasta) {
        throw new Error('No se pueden cargar datos sin fechas válidas');
      }

      // Dashboard ejecutivo consolidado + datasets complementarios
      const resultados = await Promise.allSettled([
        finanzasApi.obtenerDashboardSimplificado(filtros),
        finanzasApi.obtenerGananciasDetalladas(filtros),
        finanzasApi.obtenerGananciasPorEmpleado(filtros),
        finanzasApi.obtenerTopProductosTabla(filtros),
        finanzasApi.obtenerGananciasPorCiudad(filtros),
        finanzasApi.obtenerBalanceGeneral(filtros),
        finanzasApi.obtenerProductosMasVendidos(filtros)
      ]);

      const ejecutivo = resultados[0].status === 'fulfilled' && resultados[0].value?.success
        ? resultados[0].value.data
        : null;

      const resumenLegacy = ejecutivo ? {
        ventas: {
          monto_total: ejecutivo?.resumen?.ventas?.monto || 0,
          total_ventas: ejecutivo?.resumen?.ventas?.cantidad || 0,
          factura_promedio: ejecutivo?.resumen?.ventas?.ticket_promedio || 0
        },
        ganancias: {
          ganancia_bruta: ejecutivo?.resumen?.ganancias?.bruta || 0,
          ganancia_neta: ejecutivo?.resumen?.ganancias?.neta || 0
        },
        balance: {
          ingresos_totales: ejecutivo?.resumen?.ventas?.monto || 0,
          egresos_totales: ejecutivo?.resumen?.egresos?.total || 0,
          rentabilidad: ejecutivo?.resumen?.ventas?.monto > 0
            ? ((ejecutivo?.resumen?.resultado_neto || 0) / ejecutivo?.resumen?.ventas?.monto) * 100
            : 0
        }
      } : null;

      const dashboardData = {
        ejecutivo: { success: !!ejecutivo, data: ejecutivo },
        resumen: { success: !!resumenLegacy, data: resumenLegacy },
        ganancias: resultados[1].status === 'fulfilled' && resultados[1].value?.success ? resultados[1].value : null,
        empleados: resultados[2].status === 'fulfilled' && resultados[2].value?.success ? resultados[2].value : null,
        topProductos: resultados[3].status === 'fulfilled' && resultados[3].value?.success ? resultados[3].value : null,
        ciudades: resultados[4].status === 'fulfilled' && resultados[4].value?.success ? resultados[4].value : null,
        balance: resultados[5].status === 'fulfilled' && resultados[5].value?.success ? resultados[5].value : null,
        topVendidos: resultados[6].status === 'fulfilled' && resultados[6].value?.success ? resultados[6].value : null
      };

      // ✅ Verificar errores específicos
      const errores = [];
      const exitos = [];
      
      resultados.forEach((resultado, index) => {
        const nombres = ['ejecutivo', 'ganancias', 'empleados', 'topProductos', 'ciudades', 'balance', 'topVendidos'];
        const nombre = nombres[index];
        
        if (resultado.status === 'rejected') {
          errores.push(`${nombre}: ${resultado.reason?.message || 'Error desconocido'}`);
        } else if (resultado.value?.success) {
          exitos.push(nombre);
        } else {
          errores.push(`${nombre}: ${resultado.value?.error || 'Sin datos'}`);
        }
      });

      console.log(`📊 Dashboard cargado - Éxitos: ${exitos.length}, Errores: ${errores.length}`);
      
      if (errores.length > 0) {
        console.warn('⚠️ Errores en dashboard:', errores);
        dispatch({ type: 'SET_ERROR', payload: `Algunos datos no se pudieron cargar: ${errores.slice(0, 2).join(', ')}` });
      } else {
        dispatch({ type: 'CLEAR_ERROR' });
      }

      dispatch({ type: 'SET_DASHBOARD_DATA', payload: dashboardData });
      
      return { success: true, data: dashboardData, errores, exitos };

    } catch (error) {
      const errorMsg = error.message || 'Error cargando dashboard';
      console.error('💥 Error en cargarDashboard:', errorMsg);
      dispatch({ type: 'SET_ERROR', payload: errorMsg });
      return { success: false, error: errorMsg };
    } finally {
      dispatch({ type: 'REFRESH_COMPLETE' });
    }
  };

  // ✅ Función para actualizar todo
  const actualizarTodo = async () => {
    // ✅ Validar filtros antes de cargar
    if (!reportesConfig.validarFiltros()) {
      console.warn('⚠️ Filtros inválidos, usando valores por defecto');
    }

    return await cargarDashboard();
  };

  // Función para limpiar datos
  const limpiarDatos = () => {
    dispatch({ type: 'SET_DASHBOARD_DATA', payload: null });
    Object.keys(state.data).forEach(key => {
      dispatch({ type: 'SET_DATA', payload: { key, data: null } });
    });
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Sin auto-carga de dashboard: cada pestaña carga sus propios datos.

  // Valores del contexto
  const contextValue = {
    // Estado
    ...state,
    
    // Configuración de reportes
    ...reportesConfig,
    
    // API de finanzas
    finanzasApi,
    
    // Funciones principales
    cargarDatos,
    cargarDashboard,
    actualizarTodo,
    limpiarDatos,
    prepararFiltros, // ✅ Exponer función de preparación de filtros
    
    // Utilidades
    isLoading: (key) => state.loading[key] || false,
    isAnyLoading: Object.values(state.loading).some(Boolean) || state.refreshing,
    hasData: (key) => !!state.data[key]?.success,
    getData: (key) => state.data[key]?.data || null,
    getTotales: (key) => state.data[key]?.totales || null,
    
    // Información de estado
    lastUpdateFormatted: state.lastUpdate ? 
      new Date(state.lastUpdate).toLocaleTimeString('es-AR') : 
      'Nunca',
    
    // Helpers para formateo
    formatCurrency: finanzasApi.formatCurrency,
    formatPercentage: finanzasApi.formatPercentage,
    
    // ✅ Información adicional para debugging
    debugInfo: {
      filtrosActuales: reportesConfig.filtros,
      isPeriodoValido: reportesConfig.isPeriodoValido,
      diasEnPeriodo: reportesConfig.diasEnPeriodo,
      ultimaActualizacion: state.lastUpdate,
      isRefreshing: state.refreshing
    }
  };

  return (
    <ReportesContext.Provider value={contextValue}>
      {children}
    </ReportesContext.Provider>
  );
}

export function useReportesContext() {
  const context = useContext(ReportesContext);
  if (!context) {
    throw new Error('useReportesContext debe ser usado dentro de ReportesProvider');
  }
  return context;
}

export { useReportesUIStore };