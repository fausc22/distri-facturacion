import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { offlineManager, getAppMode } from '../utils/offlineManager';
import { axiosAuth } from '../utils/apiClient';

export function useOfflineCatalog() {
  const [loading, setLoading] = useState(false);
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [stats, setStats] = useState(null);
  const [catalogVersion, setCatalogVersion] = useState(null);

  const isPWA = getAppMode() === 'pwa';

  // ✅ VERIFICAR SI NECESITA ACTUALIZACIÓN
  useEffect(() => {
    if (isPWA) {
      checkIfNeedsUpdate();
      loadStats();
      loadCatalogVersion();
    }
  }, [isPWA]);

  const checkIfNeedsUpdate = () => {
    const clientes = offlineManager.getClientes();
    const productos = offlineManager.getProductos();
    const lastSync = offlineManager.getLastSync();
    
    // ✅ CRITERIOS PARA ACTUALIZACIÓN
    const needsUpdateFlag = clientes.length === 0 || 
                           productos.length === 0 || 
                           !lastSync.catalogo || 
                           (Date.now() - lastSync.catalogo) > 8 * 60 * 60 * 1000; // 8 horas
    
    setNeedsUpdate(needsUpdateFlag);
    setLastUpdate(lastSync.catalogo);
  };

  const loadStats = () => {
    const storageStats = offlineManager.getStorageStats();
    setStats(storageStats);
  };

  const loadCatalogVersion = () => {
    const version = offlineManager.getCatalogVersion();
    setCatalogVersion(version);
  };

  // ✅ NUEVA FUNCIÓN: DESCARGAR CATÁLOGO COMPLETO OPTIMIZADO
  const downloadFullCatalog = async () => {
    try {
      console.log('📦 Descargando catálogo completo optimizado...');
      
      // ✅ USAR ENDPOINT DEDICADO DEL BACKEND
      const response = await axiosAuth.get('/pedidos/catalogo-completo');
      
      if (response.data.success) {
        const { clientes, productos, metadata } = response.data.data;
        
        console.log(`📥 Descargando: ${clientes.length} clientes, ${productos.length} productos`);
        
        // Guardar datos offline en paralelo
        await Promise.all([
          offlineManager.saveClientes(clientes),
          offlineManager.saveProductos(productos)
        ]);
        
        offlineManager.setLastSync('catalogo');
        offlineManager.setCatalogVersion(metadata.version);
        
        console.log(`✅ Catálogo completo descargado: ${clientes.length} clientes, ${productos.length} productos`);
        
        setNeedsUpdate(false);
        setLastUpdate(Date.now());
        setCatalogVersion(metadata.version);
        loadStats();
        
        return {
          success: true,
          data: { clientes: clientes.length, productos: productos.length },
          metadata
        };
      } else {
        throw new Error(response.data.message || 'Error del servidor');
      }
      
    } catch (error) {
      console.error('❌ Error descargando catálogo completo:', error);
      throw error;
    }
  };

  // ✅ VERIFICAR SI HAY NUEVA VERSIÓN
  const checkForUpdates = async () => {
    try {
      const currentVersion = offlineManager.getCatalogVersion();
      
      const response = await axiosAuth.get('/pedidos/verificar-version-catalogo', {
        params: { version: currentVersion }
      });
      
      if (response.data.success) {
        const { necesitaActualizacion, versionServidor } = response.data.data;
        
        if (necesitaActualizacion) {
          console.log(`🔄 Nueva versión disponible: ${versionServidor} (actual: ${currentVersion})`);
          setNeedsUpdate(true);
          return { needsUpdate: true, newVersion: versionServidor };
        } else {
          console.log('✅ Catálogo actualizado');
          setNeedsUpdate(false);
          return { needsUpdate: false };
        }
      }
      
      return { needsUpdate: false };
    } catch (error) {
      console.error('❌ Error verificando actualizaciones:', error);
      return { needsUpdate: false, error: error.message };
    }
  };

  // ✅ ACTUALIZACIÓN SILENCIOSA INTELIGENTE
  const updateCatalogSilently = async () => {
    try {
      console.log('🔄 Iniciando actualización silenciosa inteligente...');
      
      // Timeout de 8 segundos para no bloquear
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 8000)
      );

      const updatePromise = downloadFullCatalog();

      const result = await Promise.race([updatePromise, timeoutPromise]);
      
      console.log(`✅ Catálogo actualizado silenciosamente: ${result.data.clientes} clientes, ${result.data.productos} productos`);
      
      return { success: true, silent: true, ...result };
      
    } catch (error) {
      console.log('⚠️ Auto-actualización silenciosa falló (normal):', error.message);
      setNeedsUpdate(true);
      return { success: false, silent: true, error: error.message };
    }
  };

  // ✅ NUEVA FUNCIÓN: AUTO-ACTUALIZACIÓN POST-PEDIDO
  const updateCatalogAfterOrder = async () => {
    if (!isPWA || !navigator.onLine) {
      console.log('⚠️ No se puede actualizar catálogo: PWA offline');
      return { success: false, reason: 'offline' };
    }

    try {
      console.log('🔄 Actualizando catálogo después de registrar pedido...');
      
      // Timeout más corto para post-pedido (5 segundos)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout post-pedido')), 5000)
      );

      const updatePromise = downloadFullCatalog();
      const result = await Promise.race([updatePromise, timeoutPromise]);
      
      console.log(`✅ Catálogo post-pedido actualizado: ${result.data.clientes} clientes, ${result.data.productos} productos`);
      
      // Toast discreto
      toast.success('📦 Catálogo actualizado', {
        duration: 2000,
        icon: '🔄'
      });
      
      return { success: true, postOrder: true, ...result };
      
    } catch (error) {
      console.log('⚠️ Actualización post-pedido falló (continuando):', error.message);
      return { success: false, postOrder: true, error: error.message };
    }
  };

  // ✅ NUEVA FUNCIÓN: AUTO-ACTUALIZACIÓN POST-SINCRONIZACIÓN
  const updateCatalogAfterSync = async () => {
    if (!isPWA || !navigator.onLine) {
      return { success: false, reason: 'offline' };
    }

    try {
      console.log('🔄 Actualizando catálogo después de sincronizar pedidos offline...');
      
      const result = await downloadFullCatalog();
      
      console.log(`✅ Catálogo post-sincronización actualizado: ${result.data.clientes} clientes, ${result.data.productos} productos`);
      
      toast.success('📦 Catálogo sincronizado', {
        duration: 2000,
        icon: '🔄'
      });
      
      return { success: true, postSync: true, ...result };
      
    } catch (error) {
      console.log('⚠️ Actualización post-sincronización falló:', error.message);
      return { success: false, postSync: true, error: error.message };
    }
  };

  // ✅ ACTUALIZACIÓN MANUAL CON FEEDBACK
  const updateCatalogManual = async () => {
    if (!navigator.onLine) {
      toast.error('Sin conexión a internet');
      return { success: false, error: 'Sin conexión' };
    }

    setLoading(true);

    try {
      console.log('🔄 Iniciando actualización manual del catálogo completo...');
      
      const result = await downloadFullCatalog();
      
      toast.success(`Catálogo actualizado: ${result.data.clientes} clientes, ${result.data.productos} productos`);
      
      return result;

    } catch (error) {
      console.error('❌ Error actualizando catálogo:', error);
      toast.error('Error al actualizar catálogo');
      
      return { 
        success: false, 
        error: error.message 
      };
    } finally {
      setLoading(false);
    }
  };

  // ✅ BÚSQUEDA HÍBRIDA MEJORADA
  const buscarClientes = async (query) => {
    if (!query || query.trim().length < 2) return [];

    if (isPWA) {
      const resultadosOffline = offlineManager.buscarClientesOffline(query);
      
      if (resultadosOffline.length > 0) {
        console.log(`📱 Búsqueda offline de clientes: ${resultadosOffline.length} resultados`);
        return resultadosOffline;
      }
      
      if (navigator.onLine) {
        try {
          const response = await axiosAuth.get(`/pedidos/filtrar-cliente?q=${encodeURIComponent(query)}`);
          return response.data?.data || [];
        } catch (error) {
          console.error('❌ Error en búsqueda online de clientes:', error);
          return resultadosOffline;
        }
      }
      
      return resultadosOffline;
    }

    if (navigator.onLine) {
      try {
        const response = await axiosAuth.get(`/pedidos/filtrar-cliente?q=${encodeURIComponent(query)}`);
        return response.data?.data || [];
      } catch (error) {
        console.error('❌ Error en búsqueda online de clientes:', error);
        return [];
      }
    }

    return [];
  };

  const buscarProductos = async (query) => {
    if (!query || query.trim().length < 2) return [];

    if (isPWA) {
      const resultadosOffline = offlineManager.buscarProductosOffline(query);
      
      if (resultadosOffline.length > 0) {
        console.log(`📱 Búsqueda offline de productos: ${resultadosOffline.length} resultados`);
        return resultadosOffline;
      }
      
      if (navigator.onLine) {
        try {
          const response = await axiosAuth.get(`/pedidos/filtrar-producto?q=${encodeURIComponent(query)}`);
          return response.data?.data || [];
        } catch (error) {
          console.error('❌ Error en búsqueda online de productos:', error);
          return resultadosOffline;
        }
      }
      
      return resultadosOffline;
    }

    if (navigator.onLine) {
      try {
        const response = await axiosAuth.get(`/pedidos/filtrar-producto?q=${encodeURIComponent(query)}`);
        return response.data?.data || [];
      } catch (error) {
        console.error('❌ Error en búsqueda online de productos:', error);
        return [];
      }
    }

    return [];
  };

  // ✅ VERIFICAR SI TENEMOS CATÁLOGO COMPLETO
  const hasCatalogComplete = () => {
    const clientes = offlineManager.getClientes();
    const productos = offlineManager.getProductos();
    
    // Umbral optimizado para base real
    return clientes.length > 100 && productos.length > 50;
  };

  // ✅ LIMPIAR CATÁLOGO OFFLINE
  const clearCatalog = () => {
    offlineManager.clearOfflineData();
    setNeedsUpdate(true);
    setLastUpdate(null);
    setCatalogVersion(null);
    loadStats();
    toast.success('Catálogo offline limpiado');
  };

  // ✅ FORMATEAR ÚLTIMA ACTUALIZACIÓN
  const getLastUpdateFormatted = () => {
    if (!lastUpdate) return 'Nunca';
    
    const now = Date.now();
    const diff = now - lastUpdate;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Hace menos de 1 minuto';
    if (minutes < 60) return `Hace ${minutes} minutos`;
    if (hours < 24) return `Hace ${hours} horas`;
    return `Hace ${days} días`;
  };

  // ✅ OBTENER INFORMACIÓN DETALLADA DEL CATÁLOGO
  const getCatalogInfo = () => {
    const clientes = offlineManager.getClientes();
    const productos = offlineManager.getProductos();
    const lastSync = offlineManager.getLastSync();
    
    return {
      clientes: clientes.length,
      productos: productos.length,
      lastUpdate: lastSync.catalogo,
      version: catalogVersion,
      complete: hasCatalogComplete(),
      storage: offlineManager.calculateStorageUsage()
    };
  };

  return {
    // Estados
    loading,
    needsUpdate,
    lastUpdate,
    lastUpdateFormatted: getLastUpdateFormatted(),
    stats,
    catalogVersion,
    isPWA,

    // Funciones principales
    updateCatalogManual,
    updateCatalogSilently,
    downloadFullCatalog,
    checkForUpdates,
    buscarClientes,
    buscarProductos,
    clearCatalog,
    
    // ✅ NUEVAS FUNCIONES DE AUTO-ACTUALIZACIÓN
    updateCatalogAfterOrder,
    updateCatalogAfterSync,
    
    // Funciones de utilidad
    loadStats,
    checkIfNeedsUpdate,
    hasCatalogComplete,
    getCatalogInfo
  };
}

// Hook para pedidos offline - OFFLINE-FIRST
// Sincronización SOLO manual desde el menú principal
import { verificarConexionReal } from '../utils/VerificadorConexion';

export function useOfflinePedidos() {
  const [pedidosPendientes, setPedidosPendientes] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ actual: 0, total: 0 });
  
  // Ref para protección contra ejecuciones múltiples
  const sincronizandoRef = useRef(false);

  const isPWA = getAppMode() === 'pwa';
  const { updateCatalogAfterSync } = useOfflineCatalog();

  useEffect(() => {
    if (isPWA) {
      loadPedidosPendientes();
    }
    // ⚠️ NO agregar listeners de eventos online/offline
    // La sincronización es SOLO manual
  }, [isPWA]);

  const loadPedidosPendientes = () => {
    const pedidos = offlineManager.getPedidosPendientes();
    // ✅ FILTRAR PEDIDOS FALLIDOS PERMANENTES
    const pedidosActivos = pedidos.filter(p => p.estado !== 'fallido_permanente');
    setPedidosPendientes(pedidosActivos);
  };

  // ✅ GUARDAR PEDIDO OFFLINE
  const savePedidoOffline = async (pedidoData) => {
    const tempId = await offlineManager.savePedidoPendiente(pedidoData);
    
    if (tempId) {
      loadPedidosPendientes();
      toast.success('Pedido guardado offline');
      return { success: true, tempId };
    }
    
    toast.error('Error al guardar pedido offline');
    return { success: false };
  };

  /**
   * Sincronizar pedidos pendientes - OFFLINE-FIRST
   * 
   * FLUJO:
   * 1. Verificar conexión REAL antes de empezar
   * 2. Procesar pedidos UNO POR UNO (no en paralelo)
   * 3. Para cada pedido:
   *    - Verificar duplicado en servidor (si tiene hash)
   *    - Si es duplicado: eliminar de pendientes
   *    - Si no es duplicado: enviar al servidor
   *    - Si exitoso: actualizar stock y eliminar de pendientes
   *    - Si falla: marcar como fallido (con límite de reintentos)
   * 4. Actualizar catálogo después de sincronizar
   * 
   * IMPORTANTE: Esta función debe ser llamada SOLO manualmente desde el menú principal
   */
  const syncPedidosPendientes = async () => {
    // Protección contra ejecuciones múltiples
    if (sincronizandoRef.current) {
      console.log('⚠️ [useOfflinePedidos] Sincronización ya en curso, ignorando solicitud duplicada');
      toast.info('Sincronización en curso, por favor espere...');
      return { success: false, error: 'Sincronización en curso' };
    }

    // Verificar conexión REAL antes de empezar
    console.log('🔍 [useOfflinePedidos] Verificando conexión real antes de sincronizar...');
    const tieneConexion = await verificarConexionReal(5000);
    
    if (!tieneConexion) {
      toast.error('Sin conexión real para sincronizar');
      return { success: false, error: 'Sin conexión' };
    }

    // Recargar pedidos pendientes antes de sincronizar
    loadPedidosPendientes();
    const pedidosActuales = offlineManager.getPedidosPendientes().filter(p => p.estado !== 'fallido_permanente');

    if (pedidosActuales.length === 0) {
      toast.info('No hay pedidos pendientes');
      return { success: true, count: 0 };
    }

    sincronizandoRef.current = true;
    setSyncing(true);
    setSyncProgress({ actual: 0, total: pedidosActuales.length });
    
    let exitosos = 0;
    let fallidos = 0;
    let duplicados = 0;

    try {
      console.log(`🔄 [useOfflinePedidos] Sincronizando ${pedidosActuales.length} pedidos pendientes...`);
      
      // Procesar pedidos UNO POR UNO (no en paralelo para evitar race conditions)
      for (let i = 0; i < pedidosActuales.length; i++) {
        const pedido = pedidosActuales[i];
        setSyncProgress({ actual: i + 1, total: pedidosActuales.length });
        
        try {
          // Verificar si el pedido tiene hash
          if (!pedido.hash_pedido) {
            console.warn(`⚠️ [useOfflinePedidos] Pedido ${pedido.tempId} no tiene hash, continuando...`);
          }
          
          console.log(`🔄 [useOfflinePedidos] Sincronizando pedido ${i + 1}/${pedidosActuales.length} - ${pedido.tempId} (hash: ${pedido.hash_pedido || 'sin hash'})...`);
          
          // Remover campos temporales pero mantener hash_pedido
          const { tempId, fechaCreacion, estado, intentos, ultimoError, ultimoIntento, ...pedidoData } = pedido;
          
          // Enviar pedido al servidor
          const response = await axiosAuth.post('/pedidos/registrar-pedido', pedidoData);
          
          if (response.data.success) {
            // Verificar si es duplicado (backend retorna existing: true)
            if (response.data.existing) {
              console.log(`⚠️ [useOfflinePedidos] Pedido ${tempId} ya existe en el backend (duplicado), removiendo de pendientes`);
              offlineManager.removePedidoPendiente(tempId);
              duplicados++;
              exitosos++; // Contar como exitoso porque ya está procesado
            } else {
              // Pedido nuevo: actualizar stock y eliminar de pendientes
              console.log(`✅ [useOfflinePedidos] Pedido ${tempId} sincronizado exitosamente`);
              
              // Actualizar stock DESPUÉS de confirmar que se guardó en el servidor
              if (pedidoData.productos && pedidoData.productos.length > 0) {
                await offlineManager.updateStockAfterSync(pedidoData.productos);
              }
              
              offlineManager.removePedidoPendiente(tempId);
              exitosos++;
            }
          } else {
            // Error del servidor
            console.error(`❌ [useOfflinePedidos] Error del servidor para pedido ${tempId}: ${response.data.message}`);
            offlineManager.markPedidoAsFailed(tempId, response.data.message);
            fallidos++;
          }
          
        } catch (error) {
          // Verificar si es error de duplicado del backend
          if (error.response?.status === 409 || error.response?.data?.code === 'DUPLICATE') {
            console.log(`⚠️ [useOfflinePedidos] Pedido ${pedido.tempId} duplicado detectado por backend, removiendo de pendientes`);
            offlineManager.removePedidoPendiente(pedido.tempId);
            duplicados++;
            exitosos++;
          } else {
            console.error(`❌ [useOfflinePedidos] Error sincronizando pedido ${pedido.tempId}:`, error);
            offlineManager.markPedidoAsFailed(pedido.tempId, error.message);
            fallidos++;
          }
        }
      }

      // Recargar pedidos pendientes después de sincronizar
      loadPedidosPendientes();
      setSyncProgress({ actual: 0, total: 0 });

      // Auto-actualización de catálogo después de sincronizar
      if (exitosos > 0) {
        const mensaje = duplicados > 0 
          ? `${exitosos} pedidos procesados (${duplicados} ya existían)`
          : `${exitosos} pedidos sincronizados correctamente`;
        toast.success(mensaje);
        
        // Actualizar catálogo después de sincronizar (no bloqueante)
        console.log('🔄 [useOfflinePedidos] Actualizando catálogo después de sincronización...');
        updateCatalogAfterSync().catch(() => {
          console.log('⚠️ [useOfflinePedidos] No se pudo actualizar catálogo después de sincronización');
        });
      }

      if (fallidos > 0) {
        toast.error(`${fallidos} pedidos no se pudieron sincronizar`);
      }

      return { 
        success: exitosos > 0, 
        exitosos, 
        fallidos, 
        duplicados,
        total: pedidosActuales.length 
      };

    } catch (error) {
      console.error('❌ [useOfflinePedidos] Error en sincronización:', error);
      toast.error('Error durante la sincronización');
      return { success: false, error: error.message };
    } finally {
      setSyncing(false);
      setSyncProgress({ actual: 0, total: 0 });
      sincronizandoRef.current = false;
    }
  };

  return {
    // Estados
    pedidosPendientes,
    syncing,
    syncProgress,
    hasPendientes: pedidosPendientes.length > 0,
    cantidadPendientes: pedidosPendientes.length,
    isPWA,

    // Funciones
    savePedidoOffline,
    syncPedidosPendientes,
    loadPedidosPendientes
  };
}