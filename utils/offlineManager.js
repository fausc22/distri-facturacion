// utils/offlineManager.js - Sistema de Storage Offline para PWA
import { toast } from 'react-hot-toast';

// ✅ HELPER PARA SSR
const isClient = () => typeof window !== 'undefined';

// ✅ DETECCIÓN DE ENTORNO
export const getAppMode = () => {
  if (!isClient()) return 'ssr';
  
  const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                window.navigator.standalone ||
                document.referrer.includes('android-app://');
  
  return isPWA ? 'pwa' : 'web';
};

// ✅ CONFIGURACIÓN DE STORAGE
const STORAGE_KEYS = {
  CLIENTES: 'vertimar_clientes_offline',
  PRODUCTOS: 'vertimar_productos_offline',
  PEDIDOS_PENDIENTES: 'vertimar_pedidos_pendientes',
  PEDIDOS_CACHE: 'vertimar_pedidos_cache',
  PEDIDOS_PRODUCTOS_CACHE: 'vertimar_pedidos_productos_cache',
  EDICIONES_PENDIENTES: 'vertimar_ediciones_pendientes',
  EDICIONES_ID_MAP: 'vertimar_ediciones_id_map',
  LAST_SYNC: 'vertimar_last_sync',
  CATALOG_VERSION: 'vertimar_catalog_version'
};

class OfflineManager {
  constructor() {
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 segundo
  }

  // ✅ DETECCIÓN DE CONECTIVIDAD
  isOnline() {
    return navigator.onLine;
  }

  // ✅ STORAGE DE CLIENTES
  async saveClientes(clientes) {
    try {
      if (!isClient()) return false;
      
      const data = {
        clientes,
        timestamp: Date.now(),
        version: this.generateVersion()
      };
      
      localStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(data));
      console.log(`📱 ${clientes.length} clientes guardados offline`);
      return true;
    } catch (error) {
      console.error('❌ Error guardando clientes offline:', error);
      return false;
    }
  }

  getClientes() {
    try {
      if (!isClient()) return [];
      
      const data = localStorage.getItem(STORAGE_KEYS.CLIENTES);
      if (!data) return [];
      
      const parsed = JSON.parse(data);
      return parsed.clientes || [];
    } catch (error) {
      console.error('❌ Error obteniendo clientes offline:', error);
      return [];
    }
  }

  // ✅ STORAGE DE PRODUCTOS
  async saveProductos(productos) {
    try {
      if (!isClient()) return false;
      
      const data = {
        productos,
        timestamp: Date.now(),
        version: this.generateVersion()
      };
      
      localStorage.setItem(STORAGE_KEYS.PRODUCTOS, JSON.stringify(data));
      console.log(`📱 ${productos.length} productos guardados offline`);
      return true;
    } catch (error) {
      console.error('❌ Error guardando productos offline:', error);
      return false;
    }
  }

  getProductos() {
    try {
      if (!isClient()) return [];
      
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTOS);
      if (!data) return [];
      
      const parsed = JSON.parse(data);
      return parsed.productos || [];
    } catch (error) {
      console.error('❌ Error obteniendo productos offline:', error);
      return [];
    }
  }

  // ✅ BÚSQUEDA OFFLINE DE CLIENTES
  buscarClientesOffline(query, options = {}) {
    const clientes = this.getClientes();
    if (!query || query.trim().length < 2) return [];
    const limit = Math.max(1, parseInt(options.limit, 10) || 10);
    const offset = Math.max(0, parseInt(options.offset, 10) || 0);
    const searchTerm = query.toLowerCase().trim();
    const resultados = clientes.filter(cliente =>
      cliente.nombre?.toLowerCase().includes(searchTerm)
    );
    return resultados.slice(offset, offset + limit);
  }

  // ✅ BÚSQUEDA OFFLINE DE PRODUCTOS
  buscarProductosOffline(query) {
    const productos = this.getProductos();
    if (!query || query.trim().length < 2) return [];
    
    const searchTerm = query.toLowerCase().trim();
    return productos.filter(producto => 
      producto.nombre?.toLowerCase().includes(searchTerm) ||
      producto.id?.toString().includes(searchTerm)
    ).slice(0, 10);
  }

  // ✅ STORAGE DE PEDIDOS PENDIENTES CON VERIFICACIÓN DE DUPLICADOS
  async savePedidoPendiente(pedidoData) {
    try {
      if (!isClient()) return false;
      
      const pedidosPendientes = this.getPedidosPendientes();
      
      // ✅ VERIFICAR DUPLICADOS POR HASH SI EXISTE
      if (pedidoData.hash_pedido) {
        const pedidoExistente = pedidosPendientes.find(p => p.hash_pedido === pedidoData.hash_pedido);
        if (pedidoExistente) {
          console.log(`⚠️ Pedido con hash ${pedidoData.hash_pedido} ya existe, no duplicar`);
          return pedidoExistente.tempId; // Retornar el tempId existente
        }
      }
      
      // Generar ID temporal único
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const pedidoPendiente = {
        ...pedidoData,
        tempId,
        fechaCreacion: new Date().toISOString(),
        estado: 'pendiente_sincronizacion',
        intentos: 0
      };
      
      pedidosPendientes.push(pedidoPendiente);
      localStorage.setItem(STORAGE_KEYS.PEDIDOS_PENDIENTES, JSON.stringify(pedidosPendientes));
      
      console.log(`📱 Pedido guardado offline con ID temporal: ${tempId}, hash: ${pedidoData.hash_pedido || 'sin hash'}`);
      return tempId;
    } catch (error) {
      console.error('❌ Error guardando pedido pendiente:', error);
      return false;
    }
  }

  getPedidosPendientes() {
    try {
      if (!isClient()) return [];
      
      const data = localStorage.getItem(STORAGE_KEYS.PEDIDOS_PENDIENTES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('❌ Error obteniendo pedidos pendientes:', error);
      return [];
    }
  }

  // ✅ CACHE DE HISTORIAL DE PEDIDOS (últimos 7 días)
  savePedidosCache(pedidos = [], maxDays = 7) {
    try {
      if (!isClient()) return false;

      const now = Date.now();
      const maxAgeMs = maxDays * 24 * 60 * 60 * 1000;
      const pedidosFiltrados = pedidos.filter((pedido) => {
        if (!pedido?.fecha) return false;
        const fechaPedido = new Date(pedido.fecha).getTime();
        return !Number.isNaN(fechaPedido) && (now - fechaPedido) <= maxAgeMs;
      });

      const payload = {
        pedidos: pedidosFiltrados,
        timestamp: now,
        maxDays
      };

      localStorage.setItem(STORAGE_KEYS.PEDIDOS_CACHE, JSON.stringify(payload));
      return true;
    } catch (error) {
      console.error('❌ Error guardando cache de pedidos:', error);
      return false;
    }
  }

  getPedidosCache({ empleadoId = null, isManager = false, maxDays = 7 } = {}) {
    try {
      if (!isClient()) return [];

      const raw = localStorage.getItem(STORAGE_KEYS.PEDIDOS_CACHE);
      if (!raw) return [];

      const parsed = JSON.parse(raw);
      const pedidos = parsed?.pedidos || [];
      const now = Date.now();
      const maxAgeMs = maxDays * 24 * 60 * 60 * 1000;

      return pedidos.filter((pedido) => {
        if (!pedido?.fecha) return false;
        const fechaPedido = new Date(pedido.fecha).getTime();
        if (Number.isNaN(fechaPedido) || (now - fechaPedido) > maxAgeMs) {
          return false;
        }

        if (isManager) return true;
        if (!empleadoId) return true;
        return Number(pedido.empleado_id) === Number(empleadoId);
      });
    } catch (error) {
      console.error('❌ Error obteniendo cache de pedidos:', error);
      return [];
    }
  }

  updatePedidoInCache(pedidoId, updater) {
    try {
      if (!isClient()) return false;
      const raw = localStorage.getItem(STORAGE_KEYS.PEDIDOS_CACHE);
      if (!raw) return false;

      const parsed = JSON.parse(raw);
      const pedidos = parsed?.pedidos || [];
      const index = pedidos.findIndex((p) => Number(p.id) === Number(pedidoId));
      if (index === -1) return false;

      pedidos[index] = typeof updater === 'function' ? updater(pedidos[index]) : pedidos[index];
      parsed.pedidos = pedidos;
      localStorage.setItem(STORAGE_KEYS.PEDIDOS_CACHE, JSON.stringify(parsed));
      return true;
    } catch (error) {
      console.error('❌ Error actualizando pedido en cache:', error);
      return false;
    }
  }

  // ✅ CACHE DE PRODUCTOS POR PEDIDO
  savePedidoProductosCache(pedidoId, productos = []) {
    try {
      if (!isClient() || !pedidoId) return false;

      const raw = localStorage.getItem(STORAGE_KEYS.PEDIDOS_PRODUCTOS_CACHE);
      const parsed = raw ? JSON.parse(raw) : {};

      parsed[String(pedidoId)] = {
        pedidoId: Number(pedidoId),
        productos,
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem(STORAGE_KEYS.PEDIDOS_PRODUCTOS_CACHE, JSON.stringify(parsed));
      return true;
    } catch (error) {
      console.error('❌ Error guardando productos de pedido en cache:', error);
      return false;
    }
  }

  getPedidoProductosCache(pedidoId) {
    try {
      if (!isClient() || !pedidoId) return [];
      const raw = localStorage.getItem(STORAGE_KEYS.PEDIDOS_PRODUCTOS_CACHE);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return parsed?.[String(pedidoId)]?.productos || [];
    } catch (error) {
      console.error('❌ Error obteniendo productos cacheados del pedido:', error);
      return [];
    }
  }

  getProductoStockLocal(productoId) {
    try {
      const productos = this.getProductos();
      const producto = productos.find((p) => Number(p.id) === Number(productoId));
      if (!producto) return 0;
      return Number(producto.stock_actual || 0);
    } catch (error) {
      console.error('❌ Error obteniendo stock local:', error);
      return 0;
    }
  }

  // ✅ COLA DE EDICIONES OFFLINE EN PEDIDOS
  queuePedidoEdit(editData) {
    try {
      if (!isClient()) return null;

      const queue = this.getPendingPedidoEdits({ includeAllStatuses: true });
      const opId = `op_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      const operation = {
        ...editData,
        opId,
        clientTs: editData.clientTs || new Date().toISOString(),
        baseVersion: editData.baseVersion || null,
        status: 'pending',
        retries: 0,
        createdAt: new Date().toISOString()
      };
      queue.push(operation);
      const compacted = this.compactPendingPedidoEdits(queue);
      localStorage.setItem(STORAGE_KEYS.EDICIONES_PENDIENTES, JSON.stringify(compacted));
      return opId;
    } catch (error) {
      console.error('❌ Error encolando edición offline:', error);
      return null;
    }
  }

  getPendingPedidoEdits({ includeAllStatuses = false } = {}) {
    try {
      if (!isClient()) return [];
      const raw = localStorage.getItem(STORAGE_KEYS.EDICIONES_PENDIENTES);
      const parsed = raw ? JSON.parse(raw) : [];
      if (includeAllStatuses) return parsed;
      return parsed.filter((op) => ['pending', 'processing', 'failed_retryable', 'conflict'].includes(op.status || 'pending'));
    } catch (error) {
      console.error('❌ Error obteniendo cola de ediciones:', error);
      return [];
    }
  }

  removePendingPedidoEdit(opId) {
    try {
      if (!isClient()) return false;
      const queue = this.getPendingPedidoEdits({ includeAllStatuses: true }).filter((op) => op.opId !== opId);
      localStorage.setItem(STORAGE_KEYS.EDICIONES_PENDIENTES, JSON.stringify(queue));
      return true;
    } catch (error) {
      console.error('❌ Error removiendo edición pendiente:', error);
      return false;
    }
  }

  setPedidoEditStatus(opId, status, extra = {}) {
    try {
      if (!isClient()) return false;
      const queue = this.getPendingPedidoEdits({ includeAllStatuses: true });
      const idx = queue.findIndex((op) => op.opId === opId);
      if (idx === -1) return false;

      queue[idx] = {
        ...queue[idx],
        status,
        ...extra
      };
      localStorage.setItem(STORAGE_KEYS.EDICIONES_PENDIENTES, JSON.stringify(queue));
      return true;
    } catch (error) {
      console.error('❌ Error actualizando estado de edición:', error);
      return false;
    }
  }

  markPedidoEditAsFailed(opId, errorMessage) {
    try {
      if (!isClient()) return false;
      const queue = this.getPendingPedidoEdits({ includeAllStatuses: true });
      const idx = queue.findIndex((op) => op.opId === opId);
      if (idx === -1) return false;

      const retries = Number(queue[idx].retries || 0) + 1;
      queue[idx].retries = retries;
      queue[idx].lastError = errorMessage;
      queue[idx].lastAttemptAt = new Date().toISOString();
      queue[idx].status = retries >= 5 ? 'failed_permanent' : 'failed_retryable';

      localStorage.setItem(STORAGE_KEYS.EDICIONES_PENDIENTES, JSON.stringify(queue));
      return true;
    } catch (error) {
      console.error('❌ Error marcando edición como fallida:', error);
      return false;
    }
  }

  markPedidoEditConflict(opId, errorMessage) {
    return this.setPedidoEditStatus(opId, 'conflict', {
      lastError: errorMessage,
      lastAttemptAt: new Date().toISOString()
    });
  }

  retryConflictedEdits() {
    try {
      if (!isClient()) return 0;
      const queue = this.getPendingPedidoEdits({ includeAllStatuses: true });
      let updated = 0;
      const next = queue.map((op) => {
        if (op.status === 'conflict') {
          updated++;
          return { ...op, status: 'pending' };
        }
        return op;
      });
      localStorage.setItem(STORAGE_KEYS.EDICIONES_PENDIENTES, JSON.stringify(next));
      return updated;
    } catch (error) {
      console.error('❌ Error reintentando conflictos:', error);
      return 0;
    }
  }

  discardPedidoEdit(opId) {
    return this.removePendingPedidoEdit(opId);
  }

  compactPendingPedidoEdits(queue = null) {
    const source = Array.isArray(queue) ? queue : this.getPendingPedidoEdits({ includeAllStatuses: true });
    const pendingOrRetry = source.filter((op) => ['pending', 'failed_retryable', 'processing'].includes(op.status || 'pending'));
    const nonCompacted = source.filter((op) => ['conflict', 'failed_permanent', 'done'].includes(op.status));

    const result = [];
    const latestUpdateByItem = new Map();
    const latestObsByPedido = new Map();
    const deletedItems = new Set();
    const removedLocalAdds = new Set();

    for (const op of pendingOrRetry) {
      const pedidoId = Number(op.pedidoId);
      if (op.type === 'UPDATE_OBSERVACIONES') {
        latestObsByPedido.set(pedidoId, op);
        continue;
      }

      if (op.type === 'UPDATE_ITEM') {
        const itemId = String(op?.payload?.itemId || '');
        latestUpdateByItem.set(`${pedidoId}:${itemId}`, op);
        continue;
      }

      if (op.type === 'DELETE_ITEM') {
        const itemId = String(op?.payload?.itemId || '');
        deletedItems.add(`${pedidoId}:${itemId}`);
        result.push(op);
        continue;
      }

      if (op.type === 'ADD_ITEM') {
        const localItemId = String(op?.payload?.localItemId || op?.payload?.product?.id || '');
        if (removedLocalAdds.has(`${pedidoId}:${localItemId}`)) {
          continue;
        }
        result.push(op);
        continue;
      }

      result.push(op);
    }

    // Si hubo delete de item local, remover add correspondiente
    const compacted = result.filter((op) => {
      if (op.type !== 'ADD_ITEM') return true;
      const pedidoId = Number(op.pedidoId);
      const localItemId = String(op?.payload?.localItemId || op?.payload?.product?.id || '');
      const wasDeleted = deletedItems.has(`${pedidoId}:${localItemId}`);
      if (wasDeleted) {
        removedLocalAdds.add(`${pedidoId}:${localItemId}`);
        return false;
      }
      return true;
    });

    const updatesToKeep = [];
    latestUpdateByItem.forEach((op, key) => {
      if (!deletedItems.has(key)) {
        updatesToKeep.push(op);
      }
    });

    latestObsByPedido.forEach((op) => compacted.push(op));
    updatesToKeep.forEach((op) => compacted.push(op));

    const ordered = [...compacted, ...nonCompacted].sort((a, b) =>
      new Date(a.createdAt || a.clientTs || 0).getTime() - new Date(b.createdAt || b.clientTs || 0).getTime()
    );
    return ordered;
  }

  savePendingPedidoEdits(queue = []) {
    try {
      if (!isClient()) return false;
      localStorage.setItem(STORAGE_KEYS.EDICIONES_PENDIENTES, JSON.stringify(queue));
      return true;
    } catch (error) {
      console.error('❌ Error guardando cola de ediciones:', error);
      return false;
    }
  }

  // ✅ MAPEOS TEMPORAL -> ID SERVIDOR
  getEditIdMappings() {
    try {
      if (!isClient()) return {};
      const raw = localStorage.getItem(STORAGE_KEYS.EDICIONES_ID_MAP);
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      console.error('❌ Error leyendo mapeos de IDs:', error);
      return {};
    }
  }

  setEditIdMapping(pedidoId, localItemId, serverItemId) {
    try {
      if (!isClient()) return false;
      const map = this.getEditIdMappings();
      const key = `${Number(pedidoId)}:${String(localItemId)}`;
      map[key] = Number(serverItemId);
      localStorage.setItem(STORAGE_KEYS.EDICIONES_ID_MAP, JSON.stringify(map));
      return true;
    } catch (error) {
      console.error('❌ Error guardando mapeo de IDs:', error);
      return false;
    }
  }

  getEditIdMapping(pedidoId, localItemId) {
    const map = this.getEditIdMappings();
    const key = `${Number(pedidoId)}:${String(localItemId)}`;
    return map[key] || null;
  }

  clearEditIdMappingsForPedido(pedidoId) {
    try {
      if (!isClient()) return false;
      const map = this.getEditIdMappings();
      const prefix = `${Number(pedidoId)}:`;
      Object.keys(map).forEach((key) => {
        if (key.startsWith(prefix)) {
          delete map[key];
        }
      });
      localStorage.setItem(STORAGE_KEYS.EDICIONES_ID_MAP, JSON.stringify(map));
      return true;
    } catch (error) {
      console.error('❌ Error limpiando mapeos por pedido:', error);
      return false;
    }
  }

  updatePendingAddItem(pedidoId, localItemId, changes = {}) {
    try {
      if (!isClient()) return false;
      const queue = this.getPendingPedidoEdits();
      const idx = queue.findIndex(
        (op) =>
          op.type === 'ADD_ITEM' &&
          Number(op.pedidoId) === Number(pedidoId) &&
          String(op.payload?.localItemId) === String(localItemId)
      );

      if (idx === -1) return false;
      queue[idx].payload.product = {
        ...(queue[idx].payload.product || {}),
        ...changes
      };

      localStorage.setItem(STORAGE_KEYS.EDICIONES_PENDIENTES, JSON.stringify(queue));
      return true;
    } catch (error) {
      console.error('❌ Error actualizando ADD_ITEM pendiente:', error);
      return false;
    }
  }

  removePendingAddItem(pedidoId, localItemId) {
    try {
      if (!isClient()) return false;
      const queue = this.getPendingPedidoEdits({ includeAllStatuses: true }).filter(
        (op) =>
          !(
            op.type === 'ADD_ITEM' &&
            Number(op.pedidoId) === Number(pedidoId) &&
            String(op.payload?.localItemId) === String(localItemId)
          )
      );
      localStorage.setItem(STORAGE_KEYS.EDICIONES_PENDIENTES, JSON.stringify(queue));
      return true;
    } catch (error) {
      console.error('❌ Error removiendo ADD_ITEM pendiente:', error);
      return false;
    }
  }

  // ✅ Helpers para edición offline de productos de un pedido
  addProductoToPedidoCache(pedidoId, product) {
    const current = this.getPedidoProductosCache(pedidoId);
    const newItem = {
      ...product,
      id: product.id || `off_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    };
    const updated = [...current, newItem];
    this.savePedidoProductosCache(pedidoId, updated);
    return updated;
  }

  updateProductoInPedidoCache(pedidoId, itemId, changes) {
    const current = this.getPedidoProductosCache(pedidoId);
    const updated = current.map((item) =>
      String(item.id) === String(itemId) ? { ...item, ...changes } : item
    );
    this.savePedidoProductosCache(pedidoId, updated);
    return updated;
  }

  deleteProductoFromPedidoCache(pedidoId, itemId) {
    const current = this.getPedidoProductosCache(pedidoId);
    const updated = current.filter((item) => String(item.id) !== String(itemId));
    this.savePedidoProductosCache(pedidoId, updated);
    return updated;
  }

  // ✅ REMOVER PEDIDO PENDIENTE DESPUÉS DE SINCRONIZAR
  removePedidoPendiente(tempId) {
    try {
      if (!isClient()) return false;
      
      const pedidosPendientes = this.getPedidosPendientes();
      const pedidosActualizados = pedidosPendientes.filter(p => p.tempId !== tempId);
      
      localStorage.setItem(STORAGE_KEYS.PEDIDOS_PENDIENTES, JSON.stringify(pedidosActualizados));
      console.log(`✅ Pedido pendiente removido: ${tempId}`);
      return true;
    } catch (error) {
      console.error('❌ Error removiendo pedido pendiente:', error);
      return false;
    }
  }

  // ✅ MARCAR PEDIDO COMO FALLIDO CON LÍMITE DE REINTENTOS
  markPedidoAsFailed(tempId, error) {
    try {
      if (!isClient()) return false;
      
      const pedidosPendientes = this.getPedidosPendientes();
      const pedidoIndex = pedidosPendientes.findIndex(p => p.tempId === tempId);
      
      if (pedidoIndex !== -1) {
        const intentos = (pedidosPendientes[pedidoIndex].intentos || 0) + 1;
        pedidosPendientes[pedidoIndex].intentos = intentos;
        pedidosPendientes[pedidoIndex].ultimoError = error;
        pedidosPendientes[pedidoIndex].ultimoIntento = new Date().toISOString();
        
        // ✅ LÍMITE DE REINTENTOS: Si supera 5 intentos, marcar como fallido permanente
        if (intentos >= 5) {
          pedidosPendientes[pedidoIndex].estado = 'fallido_permanente';
          console.log(`⚠️ Pedido ${tempId} marcado como fallido permanente después de ${intentos} intentos`);
        }
        
        localStorage.setItem(STORAGE_KEYS.PEDIDOS_PENDIENTES, JSON.stringify(pedidosPendientes));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error marcando pedido como fallido:', error);
      return false;
    }
  }

  // ✅ METADATA DE SINCRONIZACIÓN
  setLastSync(tipo, timestamp = Date.now()) {
    try {
      if (!isClient()) return false;
      
      const syncData = this.getLastSync();
      syncData[tipo] = timestamp;
      
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, JSON.stringify(syncData));
      return true;
    } catch (error) {
      console.error('❌ Error guardando última sincronización:', error);
      return false;
    }
  }

  getLastSync() {
    try {
      if (!isClient()) return {};
      
      const data = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('❌ Error obteniendo última sincronización:', error);
      return {};
    }
  }

  // ✅ VERSIONING PARA CACHE INVALIDATION
  generateVersion() {
    return Date.now().toString();
  }

  getCatalogVersion() {
    try {
      if (!isClient()) return null;
      return localStorage.getItem(STORAGE_KEYS.CATALOG_VERSION);
    } catch (error) {
      return null;
    }
  }

  setCatalogVersion(version) {
    try {
      if (!isClient()) return false;
      localStorage.setItem(STORAGE_KEYS.CATALOG_VERSION, version);
      return true;
    } catch (error) {
      return false;
    }
  }

  // ✅ LIMPIAR STORAGE OFFLINE
  clearOfflineData() {
    try {
      if (!isClient()) return false;
      
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      
      console.log('🧹 Datos offline limpiados');
      return true;
    } catch (error) {
      console.error('❌ Error limpiando datos offline:', error);
      return false;
    }
  }

  // ✅ ESTADÍSTICAS DE STORAGE
  getStorageStats() {
    try {
      if (!isClient()) return null;
      
      const clientes = this.getClientes();
      const productos = this.getProductos();
      const pedidosPendientes = this.getPedidosPendientes();
      const lastSync = this.getLastSync();
      
      return {
        clientes: clientes.length,
        productos: productos.length,
        pedidosPendientes: pedidosPendientes.length,
        pedidosCache: this.getPedidosCache({ isManager: true }).length,
        edicionesPendientes: this.getPendingPedidoEdits().filter((op) => op.status !== 'failed_permanent').length,
        lastSync,
        catalogVersion: this.getCatalogVersion(),
        storageUsed: this.calculateStorageUsage()
      };
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      return null;
    }
  }

  calculateStorageUsage() {
    try {
      let totalSize = 0;
      Object.values(STORAGE_KEYS).forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
          totalSize += new Blob([data]).size;
        }
      });
      
      return {
        bytes: totalSize,
        mb: (totalSize / (1024 * 1024)).toFixed(2)
      };
    } catch (error) {
      return { bytes: 0, mb: '0.00' };
    }
  }

  // ✅ TIMEOUT HELPER
  async withTimeout(promise, timeout = 10000) {
    return Promise.race([
      promise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), timeout)
      )
    ]);
  }

  /**
   * ⚠️ ACTUALIZAR STOCK LOCAL - SOLO DESPUÉS DE CONFIRMACIÓN DEL BACKEND
   * 
   * PRINCIPIO OFFLINE-FIRST: Stock conservador
   * - NO se debe llamar al guardar pedido offline
   * - SOLO se debe llamar después de confirmar que el pedido se guardó en el servidor
   * - Esto garantiza que el stock local nunca se desincronice
   * 
   * @param {number} productoId - ID del producto
   * @param {number} cantidadRestar - Cantidad a restar del stock
   * @returns {Promise<boolean>} - true si se actualizó correctamente
   */
  async updateLocalStock(productoId, cantidadRestar) {
    try {
      if (!isClient()) return false;
      
      const productos = this.getProductos();
      const productoIndex = productos.findIndex(p => p.id === productoId);
      
      if (productoIndex === -1) {
        console.warn(`⚠️ [offlineManager] Producto ${productoId} no encontrado en stock local`);
        return false;
      }
      
      const stockActual = productos[productoIndex].stock_actual;
      const nuevoStock = Math.max(0, stockActual - cantidadRestar);
      
      productos[productoIndex].stock_actual = nuevoStock;
      
      // Guardar productos actualizados
      const success = await this.saveProductos(productos);
      
      if (success) {
        console.log(`📦 [offlineManager] Stock local actualizado - Producto ${productoId}: ${stockActual} → ${nuevoStock}`);
      }
      
      return success;
    } catch (error) {
      console.error('❌ [offlineManager] Error actualizando stock local:', error);
      return false;
    }
  }

  /**
   * Actualizar stock DESPUÉS de sincronización exitosa
   * 
   * Esta función debe ser llamada SOLO después de confirmar que un pedido
   * se guardó exitosamente en el backend.
   * 
   * @param {Array} productos - Array de productos con {id, cantidad}
   * @returns {Promise<Object>} - {exitosos, fallidos}
   */
  async updateStockAfterSync(productos) {
    try {
      if (!isClient() || !productos || productos.length === 0) {
        return { exitosos: 0, fallidos: 0 };
      }

      let exitosos = 0;
      let fallidos = 0;
      
      console.log(`📦 [offlineManager] Actualizando stock después de sincronización: ${productos.length} productos`);
      
      for (const producto of productos) {
        const success = await this.updateLocalStock(producto.id, producto.cantidad);
        if (success) {
          exitosos++;
        } else {
          fallidos++;
          console.warn(`⚠️ [offlineManager] No se pudo actualizar stock para producto ${producto.id}`);
        }
      }
      
      console.log(`✅ [offlineManager] Stock actualizado: ${exitosos} exitosos, ${fallidos} fallidos`);
      return { exitosos, fallidos };
    } catch (error) {
      console.error('❌ [offlineManager] Error actualizando stock después de sincronización:', error);
      return { exitosos: 0, fallidos: productos.length };
    }
  }

  /**
   * Restaurar stock local (usado al anular pedido offline)
   * 
   * @param {number} productoId - ID del producto
   * @param {number} cantidadRestaurar - Cantidad a restaurar
   * @returns {Promise<boolean>} - true si se restauró correctamente
   */
  async restoreLocalStock(productoId, cantidadRestaurar) {
    try {
      if (!isClient()) return false;
      
      const productos = this.getProductos();
      const productoIndex = productos.findIndex(p => p.id === productoId);
      
      if (productoIndex === -1) {
        console.warn(`⚠️ [offlineManager] Producto ${productoId} no encontrado en stock local`);
        return false;
      }
      
      const stockActual = productos[productoIndex].stock_actual;
      const nuevoStock = stockActual + cantidadRestaurar;
      
      productos[productoIndex].stock_actual = nuevoStock;
      
      // Guardar productos actualizados
      const success = await this.saveProductos(productos);
      
      if (success) {
        console.log(`📦 [offlineManager] Stock local restaurado - Producto ${productoId}: ${stockActual} → ${nuevoStock}`);
      }
      
      return success;
    } catch (error) {
      console.error('❌ [offlineManager] Error restaurando stock local:', error);
      return false;
    }
  }

// ✅ VERIFICAR CONSISTENCIA DE STOCK
  checkStockConsistency() {
    try {
      if (!isClient()) return null;
      
      const productos = this.getProductos();
      const stockProblems = [];
      
      productos.forEach(producto => {
        if (producto.stock_actual < 0) {
          stockProblems.push({
            id: producto.id,
            nombre: producto.nombre,
            stockActual: producto.stock_actual,
            problema: 'Stock negativo'
          });
        }
        
        if (typeof producto.stock_actual !== 'number') {
          stockProblems.push({
            id: producto.id,
            nombre: producto.nombre,
            stockActual: producto.stock_actual,
            problema: 'Stock no numérico'
          });
        }
      });
      
      return {
        totalProductos: productos.length,
        problemasEncontrados: stockProblems.length,
        problemas: stockProblems
      };
    } catch (error) {
      console.error('❌ Error verificando consistencia de stock:', error);
      return null;
    }
  }

// ✅ FUNCIÓN PARA FORZAR ACTUALIZACIÓN DE CATÁLOGO
  async forceUpdateCatalog() {
    try {
      console.log('🔄 Forzando actualización de catálogo...');
      
      // Limpiar datos antiguos
      this.clearOfflineData();
      
      // Recargar página para obtener datos frescos
      if (isClient() && navigator.onLine) {
        window.location.reload();
        return { success: true, method: 'reload' };
      }
      
      return { success: false, error: 'Sin conexión' };
    } catch (error) {
      console.error('❌ Error forzando actualización:', error);
      return { success: false, error: error.message };
    }
  }

// ✅ OBTENER MÉTRICAS DETALLADAS
  getDetailedMetrics() {
    try {
      if (!isClient()) return null;
      
      const clientes = this.getClientes();
      const productos = this.getProductos();
      const pedidosPendientes = this.getPedidosPendientes();
      const lastSync = this.getLastSync();
      const stockConsistency = this.checkStockConsistency();
      
      return {
        catalogo: {
          clientes: clientes.length,
          productos: productos.length,
          ultimaActualizacion: lastSync.catalogo ? new Date(lastSync.catalogo).toLocaleString() : 'Nunca',
          diasSinActualizar: lastSync.catalogo ? Math.floor((Date.now() - lastSync.catalogo) / (1000 * 60 * 60 * 24)) : null
        },
        pedidos: {
          pendientes: pedidosPendientes.length,
          ultimoIntento: pedidosPendientes.length > 0 ? pedidosPendientes[0].ultimoIntento : null,
          totalValor: pedidosPendientes.reduce((acc, p) => acc + parseFloat(p.total || 0), 0)
        },
        stock: stockConsistency,
        storage: this.calculateStorageUsage(),
        health: {
          catalogoActualizado: lastSync.catalogo && (Date.now() - lastSync.catalogo) < 24 * 60 * 60 * 1000,
          sinPedidosPendientes: pedidosPendientes.length === 0,
          stockConsistente: stockConsistency?.problemasEncontrados === 0
        }
      };
    } catch (error) {
      console.error('❌ Error obteniendo métricas:', error);
      return null;
    }
  }
}

// ✅ EXPORTAR INSTANCIA SINGLETON
export const offlineManager = new OfflineManager();

// ✅ HOOKS PARA COMPONENTES
export const useOfflineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isPWA, setIsPWA] = useState(false);
  
  useEffect(() => {
    setIsPWA(getAppMode() === 'pwa');
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return { isOnline, isPWA, appMode: getAppMode() };
};