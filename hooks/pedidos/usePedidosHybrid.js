// hooks/pedidos/usePedidosHybrid.js - VERSIÓN MEJORADA con auto-actualización post-pedidos
import { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { axiosAuth } from '../../utils/apiClient';
import { getAppMode, offlineManager } from '../../utils/offlineManager';
import { useOfflineCatalog } from '../useOfflineCatalog';
import { generarHashPedido } from '../../utils/pedidoHash';

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

  // ✅ REGISTRAR PEDIDO HÍBRIDO CON AUTO-ACTUALIZACIÓN Y PROTECCIÓN CONTRA DUPLICADOS
  const registrarPedido = async (datosFormulario) => {
    // ✅ PROTECCIÓN CONTRA DOBLE EJECUCIÓN
    if (registrandoRef.current) {
      console.log('⚠️ Ya hay un pedido en proceso, ignorando solicitud duplicada');
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
        descuento_porcentaje: parseFloat(p.descuento_porcentaje || 0) // ✅ INCLUIR DESCUENTO
      }))
    };

    // ✅ GENERAR HASH ÚNICO DEL PEDIDO PARA IDEMPOTENCIA
    const hashPedido = generarHashPedido(pedidoData);
    pedidoData.hash_pedido = hashPedido;
    console.log(`🔐 Hash del pedido generado: ${hashPedido}`);

    // ✅ VERIFICAR SI EL PEDIDO YA FUE PROCESADO (offline)
    if (appMode === 'pwa') {
      const pedidosPendientes = offlineManager.getPedidosPendientes();
      const pedidoExistente = pedidosPendientes.find(p => p.hash_pedido === hashPedido);
      
      if (pedidoExistente) {
        console.log(`⚠️ Pedido con hash ${hashPedido} ya existe en pendientes, verificando estado...`);
        // Si ya está pendiente, no duplicar
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
    
    // ✅ CREAR ABORT CONTROLLER PARA CANCELAR PETICIONES
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      // ✅ MODO WEB: Directo a DB con auto-actualización
      if (appMode === 'web') {
        console.log('🌐 Web: Registrando pedido directamente');
        
        const response = await axiosAuth.post('/pedidos/registrar-pedido', pedidoData, {
          signal: abortControllerRef.current.signal
        });
        
        if (response.data.success) {
          // ✅ VERIFICAR SI ES DUPLICADO (backend retorna existing: true)
          if (response.data.existing) {
            console.log('⚠️ Pedido duplicado detectado por backend, retornando pedido existente');
            toast.info('Este pedido ya fue registrado anteriormente');
            return { success: true, pedidoId: response.data.pedidoId, existing: true };
          }
          
          toast.success('✅ Pedido registrado correctamente');
          
          // ✅ AUTO-ACTUALIZACIÓN SILENCIOSA DESPUÉS DEL PEDIDO
          if (navigator.onLine) {
            console.log('🔄 Actualizando catálogo después de pedido web...');
            try {
              await updateCatalogSilently();
            } catch (error) {
              console.log('⚠️ No se pudo actualizar catálogo después del pedido web');
            }
          }
          
          return { success: true, pedidoId: response.data.pedidoId };
        } else {
          toast.error(response.data.message || 'Error al registrar pedido');
          return { success: false, error: response.data.message };
        }
      }

      // ✅ MODO PWA: Intentar online con auto-actualización, fallback offline
      if (appMode === 'pwa') {
        console.log('📱 PWA: Intentando registrar pedido online con timeout de 8 segundos...');
        
        if (!navigator.onLine) {
          console.log('📱 PWA: Sin conexión, guardando offline directamente');
          const resultado = await guardarPedidoOffline(pedidoData);
          registrandoRef.current = false;
          return resultado;
        }

        try {
          // ✅ TIMEOUT DE 8 SEGUNDOS CON CANCELACIÓN DE PETICIÓN
          let timeoutId;
          const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => {
              console.log('⏱️ Timeout de 8 segundos alcanzado, cancelando petición...');
              abortControllerRef.current.abort();
              reject(new Error('Timeout de 8 segundos'));
            }, 8000);
          });

          const registroPromise = axiosAuth.post('/pedidos/registrar-pedido', pedidoData, {
            signal: abortControllerRef.current.signal
          });
          
          // ✅ RACE ENTRE PETICIÓN Y TIMEOUT
          const response = await Promise.race([registroPromise, timeoutPromise]);
          clearTimeout(timeoutId);
          
          if (response.data.success) {
            // ✅ VERIFICAR SI ES DUPLICADO
            if (response.data.existing) {
              console.log('⚠️ Pedido duplicado detectado por backend');
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
            
            console.log('✅ PWA: Pedido registrado online exitosamente');
            toast.success('✅ Pedido registrado correctamente');
            
            // ✅ AUTO-ACTUALIZACIÓN ESPECÍFICA POST-PEDIDO
            console.log('🔄 Actualizando catálogo después de pedido PWA...');
            try {
              await updateCatalogAfterOrder();
            } catch (error) {
              console.log('⚠️ No se pudo actualizar catálogo después del pedido PWA');
            }
            
            registrandoRef.current = false;
            return { success: true, pedidoId: response.data.pedidoId };
          } else {
            throw new Error(response.data.message || 'Error del servidor');
          }
          
        } catch (error) {
          // ✅ VERIFICAR SI FUE CANCELADO POR TIMEOUT O ERROR REAL
          if (error.name === 'AbortError' || error.message === 'Timeout de 8 segundos') {
            console.log(`📱 PWA: Petición cancelada por timeout, guardando offline...`);
            // ✅ VERIFICAR SI LA PETICIÓN COMPLETÓ DESPUÉS DEL TIMEOUT
            // Esperar un momento para ver si la petición completa
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Si llegamos aquí, la petición no completó, guardar offline
            const resultado = await guardarPedidoOffline(pedidoData);
            registrandoRef.current = false;
            return resultado;
          }
          
          console.log(`📱 PWA: Fallo online (${error.message}), guardando offline...`);
          const resultado = await guardarPedidoOffline(pedidoData);
          registrandoRef.current = false;
          return resultado;
        }
      }

    } catch (error) {
      console.error('❌ Error inesperado registrando pedido:', error);
      
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

  // ✅ FUNCIÓN HELPER PARA GUARDAR OFFLINE CON VERIFICACIÓN DE DUPLICADOS
  const guardarPedidoOffline = async (pedidoData) => {
    try {
      // ✅ VERIFICAR SI YA EXISTE UN PEDIDO CON EL MISMO HASH
      const hashPedido = pedidoData.hash_pedido;
      if (hashPedido) {
        const pedidosPendientes = offlineManager.getPedidosPendientes();
        const pedidoExistente = pedidosPendientes.find(p => p.hash_pedido === hashPedido);
        
        if (pedidoExistente) {
          console.log(`⚠️ Pedido con hash ${hashPedido} ya existe offline, no duplicar`);
          toast.info('Este pedido ya está pendiente de sincronización');
          return { 
            success: true, 
            offline: true, 
            tempId: pedidoExistente.tempId,
            message: 'Pedido ya pendiente'
          };
        }
      }
      
      const tempId = await offlineManager.savePedidoPendiente(pedidoData);
      
      if (tempId) {
        // ✅ ACTUALIZAR STOCK LOCAL INMEDIATAMENTE
        for (const producto of pedidoData.productos) {
          await offlineManager.updateLocalStock(producto.id, producto.cantidad);
        }
        
        toast.success('📱 Pedido guardado offline');
        console.log(`📱 Pedido guardado offline con ID: ${tempId}, hash: ${hashPedido}, stock actualizado localmente`);
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
      console.error('❌ Error guardando pedido offline:', error);
      toast.error('❌ Error al guardar pedido offline');
      return { 
        success: false, 
        error: 'Error crítico guardando offline' 
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