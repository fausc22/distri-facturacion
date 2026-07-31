// hooks/pedidos/usePedidosHybrid.js - OFFLINE-FIRST: Registro robusto de pedidos
import { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { axiosAuth } from '../../utils/apiClient';
import { getAppMode, offlineManager } from '../../utils/offlineManager';
import { useOfflineCatalog } from '../useOfflineCatalog';
import { generarHashPedido } from '../../utils/pedidoHash';

/**
 * Verificar conexión real con el backend
 */
async function verificarConexionReal(timeout = 5000) {
  if (typeof window === 'undefined' || !navigator.onLine) {
    return false;
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return false;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(`${apiUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-cache'
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

export function usePedidosHybrid() {
  const [loading, setLoading] = useState(false);
  const [pedidos, setPedidos] = useState([]);
  
  // ✅ REF PARA PROTECCIÓN CONTRA DOBLE EJECUCIÓN
  const registrandoRef = useRef(false);
  const abortControllerRef = useRef(null);

  const appMode = getAppMode();
  const { 
    updateCatalogSilently, 
    updateCatalogAfterOrder 
  } = useOfflineCatalog();

  // ✅ BUSCAR CLIENTES HÍBRIDO
  const buscarClientes = async (query) => {
    if (!query || query.trim().length < 2) {
      return [];
    }

    if (appMode === 'pwa') {
      const resultadosOffline = offlineManager.buscarClientesOffline(query);
      
      if (resultadosOffline.length > 0) {
        console.log(`📱 PWA: Búsqueda offline de clientes: ${resultadosOffline.length} resultados`);
        return resultadosOffline;
      }
      
      if (navigator.onLine) {
        try {
          const response = await axiosAuth.get(`/pedidos/filtrar-cliente?q=${encodeURIComponent(query)}`);
          return response.data.success ? response.data.data : [];
        } catch (error) {
          console.error('❌ PWA: Error en búsqueda online de clientes:', error);
          return resultadosOffline;
        }
      }
      
      return resultadosOffline;
    }

    try {
      const response = await axiosAuth.get(`/pedidos/filtrar-cliente?q=${encodeURIComponent(query)}`);
      return response.data.success ? response.data.data : [];
    } catch (error) {
      console.error('🌐 Web: Error buscando clientes:', error);
      toast.error('Error al buscar clientes');
      return [];
    }
  };

  // ✅ BUSCAR PRODUCTOS HÍBRIDO
  const buscarProductos = async (query) => {
    if (!query || query.trim().length < 2) {
      return [];
    }

    if (appMode === 'pwa') {
      const resultadosOffline = offlineManager.buscarProductosOffline(query);
      
      if (resultadosOffline.length > 0) {
        console.log(`📱 PWA: Búsqueda offline de productos: ${resultadosOffline.length} resultados`);
        return resultadosOffline;
      }
      
      if (navigator.onLine) {
        try {
          const response = await axiosAuth.get(`/pedidos/filtrar-producto?q=${encodeURIComponent(query)}`);
          return response.data.success ? response.data.data : [];
        } catch (error) {
          console.error('❌ PWA: Error en búsqueda online de productos:', error);
          return resultadosOffline;
        }
      }
      
      return resultadosOffline;
    }

    try {
      const response = await axiosAuth.get(`/pedidos/filtrar-producto?q=${encodeURIComponent(query)}`);
      return response.data.success ? response.data.data : [];
    } catch (error) {
      console.error('🌐 Web: Error buscando productos:', error);
      toast.error('Error al buscar productos');
      return [];
    }
  };

  /**
   * Registrar pedido - OFFLINE-FIRST
   * 
   * FLUJO:
   * 1. Si modoOfflineForzado = true → guardar offline DIRECTAMENTE
   * 2. Si modoOfflineForzado = false:
   *    - Verificar conexión REAL
   *    - Si hay conexión: intentar online (timeout 30s)
   *    - Si no hay conexión o falla: guardar offline
   * 3. NUNCA intentar ambos (online Y offline) en la misma ejecución
   * 
   * @param {Object} datosFormulario - Datos del formulario
   * @param {boolean} modoOfflineForzado - Si true, guarda offline directamente
   * @returns {Promise<Object>} - Resultado del registro
   */
  const registrarPedido = async (datosFormulario, modoOfflineForzado = false) => {
    // Protección contra doble ejecución
    if (registrandoRef.current) {
      console.log('⚠️ [usePedidosHybrid] Ya hay un pedido en proceso, ignorando solicitud duplicada');
      return { success: false, error: 'Ya hay un pedido en proceso' };
    }

    const { cliente, productos, observaciones, empleado } = datosFormulario;

    if (!cliente || !productos || productos.length === 0) {
      toast.error('Debe seleccionar un cliente y al menos un producto');
      return { success: false };
    }

    // Calcular totales
    const subtotal = productos.reduce((acc, prod) => acc + prod.subtotal, 0);
    const totalIva = productos.reduce((acc, prod) => acc + prod.iva_calculado, 0);
    const total = subtotal + totalIva;

    // Preparar datos del pedido
    const pedidoData = {
      cliente_id: cliente.id,
      cliente_nombre: cliente.nombre,
      cliente_telefono: cliente.telefono || '',
      cliente_direccion: cliente.direccion || '',
      cliente_ciudad: cliente.ciudad || '',
      cliente_provincia: cliente.provincia || '',
      cliente_condicion: cliente.condicion_iva || '',
      cliente_cuit: cliente.cuit || '',
      subtotal: subtotal.toFixed(2),
      iva_total: totalIva.toFixed(2),
      total: total.toFixed(2),
      estado: 'Exportado',
      empleado_id: empleado?.id || 1,
      empleado_nombre: empleado?.nombre || 'Usuario',
      observaciones: observaciones || 'sin observaciones',
      productos: productos.map(p => ({
        id: p.id,
        nombre: p.nombre,
        unidad_medida: p.unidad_medida || 'Unidad',
        cantidad: p.cantidad,
        precio: parseFloat(p.precio),
        iva: parseFloat(p.iva_calculado),
        subtotal: parseFloat(p.subtotal),
        descuento_porcentaje: parseFloat(p.descuento_porcentaje || 0), // ✅ INCLUIR DESCUENTO
        // Compatibilidad con modo manual de precio (backend ignora si no lo usa)
        precio_incluye_iva: Boolean(p.precio_incluye_iva),
        precio_unitario_final_manual:
          p.precio_unitario_final_manual !== undefined &&
          p.precio_unitario_final_manual !== null
            ? parseFloat(p.precio_unitario_final_manual)
            : null
      }))
    };

    // Generar hash único del pedido para idempotencia
    const hashPedido = generarHashPedido(pedidoData);
    pedidoData.hash_pedido = hashPedido;
    console.log(`🔐 [usePedidosHybrid] Hash del pedido generado: ${hashPedido}`);

    // Verificar si el pedido ya fue procesado (offline o online)
    if (appMode === 'pwa') {
      const pedidosPendientes = offlineManager.getPedidosPendientes();
      const pedidoExistente = pedidosPendientes.find(p => p.hash_pedido === hashPedido);
      
      if (pedidoExistente) {
        console.log(`⚠️ [usePedidosHybrid] Pedido con hash ${hashPedido} ya existe en pendientes`);
        toast.info('Este pedido ya está pendiente de sincronización');
        return { 
          success: true, 
          offline: true, 
          tempId: pedidoExistente.tempId,
          message: 'Pedido ya pendiente'
        };
      }
    }

    registrandoRef.current = true;
    setLoading(true);
    
    // Crear abort controller para cancelar peticiones
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      // MODO WEB: Directo a DB
      if (appMode === 'web') {
        console.log('🌐 [usePedidosHybrid] Modo WEB: Registrando pedido directamente');
        
        const response = await axiosAuth.post('/pedidos/registrar-pedido', pedidoData, {
          signal: abortControllerRef.current.signal
        });
        
        if (response.data.success) {
          if (response.data.existing) {
            console.log('⚠️ [usePedidosHybrid] Pedido duplicado detectado por backend');
            toast.info('Este pedido ya fue registrado anteriormente');
            return { success: true, pedidoId: response.data.pedidoId, existing: true };
          }
          
          toast.success('✅ Pedido registrado correctamente');
          
          // Auto-actualización silenciosa después del pedido
          if (navigator.onLine) {
            updateCatalogSilently().catch(() => {
              console.log('⚠️ [usePedidosHybrid] No se pudo actualizar catálogo después del pedido web');
            });
          }
          
          return { success: true, pedidoId: response.data.pedidoId };
        } else {
          toast.error(response.data.message || 'Error al registrar pedido');
          return { success: false, error: response.data.message };
        }
      }

      // MODO PWA: Lógica offline-first
      if (appMode === 'pwa') {
        // Si modo offline forzado, guardar offline directamente
        if (modoOfflineForzado) {
          console.log('📱 [usePedidosHybrid] Modo OFFLINE FORZADO: Guardando offline directamente');
          const resultado = await guardarPedidoOffline(pedidoData);
          registrandoRef.current = false;
          return resultado;
        }

        // Verificar conexión REAL antes de intentar online
        console.log('🔍 [usePedidosHybrid] Verificando conexión real antes de intentar online...');
        const tieneConexion = await verificarConexionReal(5000);
        
        if (!tieneConexion) {
          console.log('📴 [usePedidosHybrid] Sin conexión real, guardando offline');
          const resultado = await guardarPedidoOffline(pedidoData);
          registrandoRef.current = false;
          return resultado;
        }

        // Hay conexión: intentar online con timeout largo (30s para conexiones lentas)
        console.log('🌐 [usePedidosHybrid] Conexión confirmada, intentando registrar online (timeout 30s)...');
        
        try {
          const timeoutMs = 30000; // 30 segundos para conexiones lentas
          let timeoutId;
          
          const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => {
              console.log(`⏱️ [usePedidosHybrid] Timeout de ${timeoutMs}ms alcanzado`);
              abortControllerRef.current.abort();
              reject(new Error(`Timeout de ${timeoutMs}ms`));
            }, timeoutMs);
          });

          const registroPromise = axiosAuth.post('/pedidos/registrar-pedido', pedidoData, {
            signal: abortControllerRef.current.signal
          });
          
          const response = await Promise.race([registroPromise, timeoutPromise]);
          clearTimeout(timeoutId);
          
          if (response.data.success) {
            // Verificar si es duplicado
            if (response.data.existing) {
              console.log('⚠️ [usePedidosHybrid] Pedido duplicado detectado por backend');
              toast.info('Este pedido ya fue registrado anteriormente');
              
              // Remover de pendientes si estaba ahí
              const pedidosPendientes = offlineManager.getPedidosPendientes();
              const pedidoPendiente = pedidosPendientes.find(p => p.hash_pedido === hashPedido);
              if (pedidoPendiente) {
                offlineManager.removePedidoPendiente(pedidoPendiente.tempId);
              }
              
              registrandoRef.current = false;
              return { success: true, pedidoId: response.data.pedidoId, existing: true };
            }
            
            console.log('✅ [usePedidosHybrid] Pedido registrado online exitosamente');
            toast.success('✅ Pedido registrado correctamente');
            
            // Auto-actualización post-pedido (no bloqueante)
            updateCatalogAfterOrder().catch(() => {
              console.log('⚠️ [usePedidosHybrid] No se pudo actualizar catálogo después del pedido');
            });
            
            registrandoRef.current = false;
            return { success: true, pedidoId: response.data.pedidoId };
          } else {
            throw new Error(response.data.message || 'Error del servidor');
          }
          
        } catch (error) {
          // Si falla online (timeout, error de red, etc.), guardar offline
          if (error.name === 'AbortError' || error.message.includes('Timeout')) {
            console.log(`📱 [usePedidosHybrid] Petición cancelada por timeout, guardando offline...`);
          } else {
            console.log(`📱 [usePedidosHybrid] Fallo online (${error.message}), guardando offline...`);
          }
          
          const resultado = await guardarPedidoOffline(pedidoData);
          registrandoRef.current = false;
          return resultado;
        }
      }

    } catch (error) {
      console.error('❌ [usePedidosHybrid] Error inesperado registrando pedido:', error);
      
      if (appMode === 'pwa') {
        const resultado = await guardarPedidoOffline(pedidoData);
        registrandoRef.current = false;
        return resultado;
      }
      
      toast.error('Error al registrar el pedido. Verifique su conexión.');
      registrandoRef.current = false;
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
      registrandoRef.current = false;
    }
  };

  /**
   * Guardar pedido offline - OFFLINE-FIRST
   * 
   * IMPORTANTE:
   * - NO actualiza stock local (stock conservador)
   * - Verifica duplicados antes de guardar
   * - Stock se actualizará SOLO después de sincronización exitosa
   * 
   * @param {Object} pedidoData - Datos del pedido
   * @returns {Promise<Object>} - Resultado del guardado
   */
  const guardarPedidoOffline = async (pedidoData) => {
    try {
      // Verificar si ya existe un pedido con el mismo hash
      const hashPedido = pedidoData.hash_pedido;
      if (hashPedido) {
        const pedidosPendientes = offlineManager.getPedidosPendientes();
        const pedidoExistente = pedidosPendientes.find(p => p.hash_pedido === hashPedido);
        
        if (pedidoExistente) {
          console.log(`⚠️ [usePedidosHybrid] Pedido con hash ${hashPedido} ya existe offline, no duplicar`);
          toast.info('Este pedido ya está pendiente de sincronización');
          return { 
            success: true, 
            offline: true, 
            tempId: pedidoExistente.tempId,
            message: 'Pedido ya pendiente'
          };
        }
      }
      
      // Guardar pedido pendiente
      const tempId = await offlineManager.savePedidoPendiente(pedidoData);
      
      if (tempId) {
        // ⚠️ NO ACTUALIZAR STOCK LOCAL - Stock conservador
        // El stock se actualizará SOLO después de confirmar que el pedido se guardó en el servidor
        // Esto garantiza que el stock local nunca se desincronice
        
        toast.success('📱 Pedido guardado offline');
        console.log(`📱 [usePedidosHybrid] Pedido guardado offline - ID: ${tempId}, hash: ${hashPedido}`);
        console.log(`📦 [usePedidosHybrid] Stock NO actualizado (conservador) - Se actualizará después de sincronización`);
        
        return { 
          success: true, 
          offline: true, 
          tempId,
          message: 'Pedido guardado offline'
        };
      } else {
        toast.error('❌ Error al guardar pedido offline');
        return { 
          success: false, 
          error: 'Error guardando offline' 
        };
      }
    } catch (error) {
      console.error('❌ [usePedidosHybrid] Error guardando pedido offline:', error);
      if (!error?.isQuotaExceeded) {
        toast.error('❌ Error al guardar pedido offline');
      }
      return { 
        success: false, 
        error: error?.message || 'Error crítico guardando offline' 
      };
    }
  };

  // ✅ CARGAR PEDIDOS
  const cargarPedidos = async () => {
    setLoading(true);
    try {
      const response = await axiosAuth.get('/pedidos/obtener-pedidos');
      
      if (response.data.success) {
        setPedidos(response.data.data);
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Error al cargar pedidos');
      }
    } catch (error) {
      console.error('Error cargando pedidos:', error);
      toast.error('Error al cargar pedidos');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // ✅ OBTENER DETALLE DE PEDIDO
  const obtenerDetallePedido = async (pedidoId) => {
    setLoading(true);
    try {
      const response = await axiosAuth.get(`/pedidos/detalle-pedido/${pedidoId}`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Error al obtener detalle');
      }
    } catch (error) {
      console.error('Error obteniendo detalle:', error);
      toast.error('Error al obtener detalle del pedido');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ✅ ACTUALIZAR ESTADO DE PEDIDO
  const actualizarEstadoPedido = async (pedidoId, nuevoEstado) => {
    setLoading(true);
    try {
      const response = await axiosAuth.put(`/pedidos/actualizar-estado/${pedidoId}`, {
        estado: nuevoEstado
      });
      
      if (response.data.success) {
        toast.success('Estado actualizado correctamente');
        return { success: true };
      } else {
        throw new Error(response.data.message || 'Error al actualizar estado');
      }
    } catch (error) {
      console.error('Error actualizando estado:', error);
      toast.error('Error al actualizar estado del pedido');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  // ✅ ELIMINAR PEDIDO
  const eliminarPedido = async (pedidoId) => {
    setLoading(true);
    try {
      const response = await axiosAuth.delete(`/pedidos/eliminar-pedido/${pedidoId}`);
      
      if (response.data.success) {
        toast.success('Pedido eliminado correctamente');
        await cargarPedidos();
        return { success: true };
      } else {
        throw new Error(response.data.message || 'Error al eliminar pedido');
      }
    } catch (error) {
      console.error('Error eliminando pedido:', error);
      toast.error('Error al eliminar pedido');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  // ✅ FUNCIÓN PARA VERIFICAR MODO ACTUAL
  const getMode = () => appMode;

  // ✅ FUNCIÓN PARA OBTENER ESTADÍSTICAS OFFLINE
  const getOfflineStats = () => {
    if (appMode === 'pwa') {
      return offlineManager.getStorageStats();
    }
    return null;
  };

  return {
    // Estados
    loading,
    pedidos,
    appMode,
    
    // ✅ FUNCIONES DE BÚSQUEDA HÍBRIDAS MEJORADAS
    buscarClientes,
    buscarProductos,
    
    // Funciones de pedidos híbridas con auto-actualización
    registrarPedido,
    cargarPedidos,
    obtenerDetallePedido,
    actualizarEstadoPedido,
    eliminarPedido,
    
    // Funciones específicas PWA
    guardarPedidoOffline,
    getMode,
    getOfflineStats,
    
    // Indicadores
    isPWA: appMode === 'pwa',
    isWeb: appMode === 'web'
  };
}