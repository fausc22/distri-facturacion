import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { toast } from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';

import { PedidosProvider, usePedidosContext } from '../../context/PedidosContext';
import { usePedidosHybrid } from '../../hooks/pedidos/usePedidosHybrid';
import { useConnectionContext } from '../../context/ConnectionContext';
import { getAppMode, offlineManager } from '../../utils/offlineManager';
import { usePedidosFormPersistence } from '../../hooks/useFormPersistence';

// ✅ COMPONENTES HÍBRIDOS
import ClienteSelectorHybrid from '../../components/pedidos/SelectorClientesHybrid';
import ProductoSelectorHybrid from '../../components/pedidos/SelectorProductosHybrid';
import ProductosCarrito from '../../components/pedidos/ProductosCarrito';
import ObservacionesPedido from '../../components/pedidos/ObservacionesPedido';
import { 
  ModalConfirmacionPedido, 
  ModalConfirmacionSalidaPedidos 
} from '../../components/pedidos/ModalesConfirmacion';

// ✅ MODAL DE RECONEXIÓN
import ModalConexionRestablecida from '../../components/pedidos/ModalConexionRestablecida';

function RegistrarPedidoContent() {
  const { 
    cliente, 
    productos, 
    observaciones,
    total, 
    totalProductos,
    clearPedido,
    getDatosPedido,
    setCliente,
    setObservaciones,
    addMultipleProductos
  } = usePedidosContext();
 
  const { registrarPedido, loading } = usePedidosHybrid();
  const { user } = useAuth();

  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [mostrarConfirmacionSalida, setMostrarConfirmacionSalida] = useState(false);
  const [catalogStats, setCatalogStats] = useState(null);
  
  // ✅ ESTADOS DE CONTROL ESTRICTO
  const [mostrarModalReconexion, setMostrarModalReconexion] = useState(false);
  const [modoForzadoOffline, setModoForzadoOffline] = useState(false);
  const [loadingConexion, setLoadingConexion] = useState(false);
  const [interfazLocked, setInterfazLocked] = useState(false);

  // ✅ NUEVOS ESTADOS PARA PERSISTENCIA
  const [estadoInicializado, setEstadoInicializado] = useState(false);
  const [ultimoEstadoConexion, setUltimoEstadoConexion] = useState(null);
  
  // ✅ REF PARA EVITAR MÚLTIPLES INICIALIZACIONES
  const inicializacionCompletada = useRef(false);
  const formRestaurado = useRef(false);

  // ✅ CONEXIÓN CENTRALIZADA
  const { modoOffline, isPWA, verificarConexionHealth } = useConnectionContext();

  // ✅ Función auxiliar para verificar conexión bajo demanda
  const verificarConexion = async () => {
    try {
      return await verificarConexionHealth();
    } catch {
      return false;
    }
  };

  // ✅ FORM PERSISTENCE MEJORADO
  const {
    saveForm,
    restoreForm,
    clearSavedForm,
    hasSavedForm,
    getSavedFormInfo
  } = usePedidosFormPersistence({
    cliente,
    productos,
    observaciones,
    subtotal: total - (total - total * 0.79),
    totalIva: total - (total * 0.79),
    total,
    totalProductos
  });

  // ✅ PERSISTENCIA INMEDIATA EN LOCALSTORAGE
  const guardarEstadoCompleto = () => {
    if (!estadoInicializado) return;
    
    try {
      const estadoCompleto = {
        cliente,
        productos,
        observaciones,
        modoForzadoOffline,
        interfazLocked,
        timestamp: Date.now(),
        route: '/ventas/RegistrarPedido'
      };
      
      localStorage.setItem('vertimar_pedido_estado_completo', JSON.stringify(estadoCompleto));
      console.log('💾 [Estado] Estado completo guardado en localStorage');
    } catch (error) {
      console.error('❌ [Estado] Error guardando estado completo:', error);
    }
  };

  const restaurarEstadoCompleto = () => {
    if (formRestaurado.current) return false;
    
    try {
      const estadoGuardado = localStorage.getItem('vertimar_pedido_estado_completo');
      if (!estadoGuardado) return false;
      
      const estado = JSON.parse(estadoGuardado);
      
      // Verificar que el estado no sea muy antiguo (más de 24 horas)
      const horasTranscurridas = (Date.now() - estado.timestamp) / (1000 * 60 * 60);
      if (horasTranscurridas > 24) {
        console.log('⏰ [Estado] Estado guardado muy antiguo, descartando');
        localStorage.removeItem('vertimar_pedido_estado_completo');
        return false;
      }
      
      console.log('🔄 [Estado] Restaurando estado completo desde localStorage');
      
      // Restaurar cliente
      if (estado.cliente) {
        setCliente(estado.cliente);
      }
      
      // Restaurar productos
      if (estado.productos && estado.productos.length > 0) {
        addMultipleProductos(estado.productos);
      }
      
      // Restaurar observaciones
      if (estado.observaciones) {
        setObservaciones(estado.observaciones);
      }
      
      // Restaurar estados de modo
      setModoForzadoOffline(estado.modoForzadoOffline || false);
      setInterfazLocked(estado.interfazLocked || false);
      
      formRestaurado.current = true;
      
      const itemsRestaurados = [];
      if (estado.cliente) itemsRestaurados.push('cliente');
      if (estado.productos?.length > 0) itemsRestaurados.push(`${estado.productos.length} productos`);
      if (estado.observaciones) itemsRestaurados.push('observaciones');
      
      if (itemsRestaurados.length > 0) {
        
      }
      
      return true;
    } catch (error) {
      console.error('❌ [Estado] Error restaurando estado completo:', error);
      return false;
    }
  };

  // ⚠️ INICIALIZACIÓN ENDURECIDA: Cold start offline siempre funciona
  useEffect(() => {
    if (inicializacionCompletada.current) return;

    console.log('🚀 [RegistrarPedido] Inicialización única comenzando...');

    // Restaurar estado antes de detectar modo
    const estadoRestaurado = restaurarEstadoCompleto();

    // ⚠️ OFFLINE-FIRST: Si es PWA y no hay conexión, SIEMPRE activar modo offline
    // Esto garantiza que el usuario pueda registrar pedidos incluso en cold start
    if (isPWA) {
      if (modoOffline) {
        console.log('📱 [RegistrarPedido] Inicialización OFFLINE - Activando modo offline estable');
        setModoForzadoOffline(true);
        setInterfazLocked(true);
      } else {
        console.log('🌐 [RegistrarPedido] Inicialización ONLINE - Modo online disponible');
        // Solo si no hay estado restaurado que indique modo forzado
        if (!estadoRestaurado) {
          setModoForzadoOffline(false);
          setInterfazLocked(false);
        }
      }
    } else {
      // Modo web: siempre online
      setModoForzadoOffline(false);
      setInterfazLocked(false);
    }

    setUltimoEstadoConexion(!modoOffline);
    setEstadoInicializado(true);
    inicializacionCompletada.current = true;

    console.log('✅ [RegistrarPedido] Inicialización única completada - Modo:', modoForzadoOffline ? 'OFFLINE' : 'ONLINE');
  }, []); // Solo ejecutar UNA VEZ

  // ✅ CARGAR ESTADÍSTICAS PWA
  useEffect(() => {
    if (isPWA) {
      const stats = offlineManager.getStorageStats();
      setCatalogStats(stats);
    }
  }, [isPWA]);

  // ⚠️ OFFLINE-FIRST: IGNORAR eventos de conectividad durante el flujo
  // Los eventos de conexión NO deben cambiar el modo ni interrumpir el flujo
  useEffect(() => {
    if (!estadoInicializado) return;

    // ⚠️ SIEMPRE ignorar eventos de conexión durante el flujo de registro
    // El modo offline forzado se mantiene hasta que el usuario:
    // 1. Guarde el pedido (entonces se verifica conexión)
    // 2. Vuelva al menú (entonces se verifica conexión)
    // La conexión se maneja de forma centralizada en ConnectionContext

    // Solo actualizar estadísticas (no cambiar modo)
    if (isPWA) {
      const stats = offlineManager.getStorageStats();
      setCatalogStats(stats);
    }
  }, [modoOffline, estadoInicializado, isPWA]);

  // ✅ AUTO-RESTORE DE BACKUP FALLBACK (por si localStorage falla)
  useEffect(() => {
    if (!estadoInicializado || formRestaurado.current) return;
    
    // Intentar con el sistema de persistencia tradicional como fallback
    if (hasSavedForm()) {
      console.log('🔄 [RegistrarPedido] Usando sistema de persistencia fallback');
      const savedData = restoreForm();
      
      if (savedData) {
        let itemsRestored = [];
        
        if (savedData.cliente && !cliente) {
          setCliente(savedData.cliente);
          itemsRestored.push('cliente');
        }
        
        if (savedData.observaciones && !observaciones) {
          setObservaciones(savedData.observaciones);
          itemsRestored.push('observaciones');
        }
        
        if (savedData.productos && savedData.productos.length > 0 && productos.length === 0) {
          addMultipleProductos(savedData.productos);
          itemsRestored.push(`${savedData.productos.length} productos`);
        }
        
        
        
        clearSavedForm();
        formRestaurado.current = true;
      }
    }
  }, [estadoInicializado]);

  // Auto-save continuo - OFFLINE-FIRST: Guardar más frecuentemente
  useEffect(() => {
    if (!estadoInicializado) return;
    
    if (cliente || productos.length > 0 || observaciones.trim()) {
      // Guardar en ambos sistemas cada 10 segundos (más frecuente para conexiones inestables)
      const interval = setInterval(() => {
        saveForm(); // Sistema tradicional
        guardarEstadoCompleto(); // Sistema completo
      }, 10000); // Cada 10 segundos

      return () => clearInterval(interval);
    }
  }, [cliente, productos, observaciones, estadoInicializado, saveForm]);

  // ✅ GUARDAR ESTADO EN CADA CAMBIO IMPORTANTE
  useEffect(() => {
    if (estadoInicializado) {
      guardarEstadoCompleto();
    }
  }, [cliente, productos, observaciones, modoForzadoOffline, interfazLocked, estadoInicializado]);

  const handleConfirmarPedido = () => {
    if (!cliente) {
      toast.error('Debe seleccionar un cliente.');
      return;
    }
    
    if (productos.length === 0) {
      toast.error('Debe agregar al menos un producto.');
      return;
    }
    
    setMostrarConfirmacion(true);
  };

  // Registrar pedido - OFFLINE-FIRST
  const handleRegistrarPedido = async () => {
    const datosPedido = getDatosPedido();
    const datosCompletos = {
      ...datosPedido,
      empleado: user
    };
    
    console.log(`🔄 [RegistrarPedido] Registrando pedido - Modo offline forzado: ${modoForzadoOffline}`);
    
    // Pasar modoOfflineForzado al hook
    const resultado = await registrarPedido(datosCompletos, modoForzadoOffline);
    
    if (resultado.success) {
      // ✅ LIMPIAR TODOS LOS SISTEMAS DE PERSISTENCIA
      clearSavedForm();
      localStorage.removeItem('vertimar_pedido_estado_completo');
      clearPedido();
      setMostrarConfirmacion(false);
      formRestaurado.current = false; // Permitir nueva restauración
      
      console.log('🧹 [RegistrarPedido] Estado limpiado después de guardar pedido exitoso');
      
      // Actualizar estadísticas
      if (isPWA) {
        const newStats = offlineManager.getStorageStats();
        setCatalogStats(newStats);
      }
      
      // Lógica OFFLINE-FIRST: Verificar conexión solo después de guardar offline
      if (resultado.offline || modoForzadoOffline) {
        console.log('📱 [RegistrarPedido] Pedido guardado offline - Verificando conexión disponible...');
        
        // Verificar conexión bajo demanda (solo para mostrar opciones, no cambiar modo)
        const hayConexion = await verificarConexion();
        
        if (hayConexion && !modoForzadoOffline) {
          // Hay conexión pero no estamos en modo forzado: Mostrar opción de sincronizar
          console.log('🌐 [RegistrarPedido] Conexión disponible - Mostrando opción de sincronizar');
          setMostrarModalReconexion(true);
        } else {
          // Sin conexión o modo forzado: Solo confirmar que se guardó offline
          console.log('📱 [RegistrarPedido] Pedido guardado offline correctamente');
          // El toast ya se mostró en guardarPedidoOffline
        }
      } else {
        // Pedido online: Toast normal
        console.log('🌐 [RegistrarPedido] Pedido registrado online exitosamente');
        // El toast ya se mostró en registrarPedido
      }
    } else {
      console.error('❌ [RegistrarPedido] Error registrando pedido:', resultado.error);
    }
  };

  // ✅ MANEJAR "IR A MENÚ" DEL MODAL DE RECONEXIÓN
  const handleIrAMenuDesdeModal = async () => {
    setLoadingConexion(true);
    
    console.log('🔍 [RegistrarPedido] Verificando conexión para ir al menú desde modal...');
    
    // Verificar conexión antes de ir al menú
    const hayConexion = await verificarConexion();
    
    if (hayConexion) {
      console.log('🌐 [RegistrarPedido] Conexión confirmada desde modal - Redirigiendo al menú');
      setMostrarModalReconexion(false);
      
      // ✅ LIMPIAR ESTADO ANTES DE SALIR
      localStorage.removeItem('vertimar_pedido_estado_completo');
      
      // Guardar formulario actual como backup
      if (cliente || productos.length > 0 || observaciones.trim()) {
        saveForm();
      }
      
      window.location.href = '/inicio';
    } else {
      console.log('📴 [RegistrarPedido] Sin conexión desde modal - No se puede ir al menú');
      setLoadingConexion(false);
      setMostrarModalReconexion(false);
      
      toast.error('📴 Sin conexión - No se puede acceder al menú', {
        duration: 3000,
        icon: '📴'
      });
    }
  };

  // ✅ MANEJAR "SEGUIR REGISTRANDO" DEL MODAL DE RECONEXIÓN
  const handleSeguirRegistrandoDesdeModal = () => {
    console.log('📱 [RegistrarPedido] Usuario eligió seguir registrando - Activando modo offline estable');
    setModoForzadoOffline(true);
    setInterfazLocked(true);
    setMostrarModalReconexion(false);
    
    // ✅ GUARDAR NUEVA CONFIGURACIÓN
    guardarEstadoCompleto();
    
    
  };

  // ✅ MANEJAR "VOLVER AL INICIO" CON VERIFICACIÓN
  const handleConfirmarSalida = () => {
    if (cliente || productos.length > 0 || observaciones.trim()) {
      setMostrarConfirmacionSalida(true);
    } else {
      handleSalirConVerificacion();
    }
  };

  // ✅ SALIR CON VERIFICACIÓN DE CONEXIÓN
  const handleSalirConVerificacion = async () => {
    console.log('🚪 [RegistrarPedido] Intentando salir - Verificando conexión...');
    
    setLoadingConexion(true);
    
    // Verificar conexión antes de salir
    const hayConexion = await verificarConexion();
    
    if (hayConexion) {
      console.log('🌐 [RegistrarPedido] Conexión confirmada para salir - Redirigiendo al menú');
      
      // Guardar formulario antes de salir
      if (cliente || productos.length > 0 || observaciones.trim()) {
        saveForm();
        guardarEstadoCompleto();
      } else {
        // Si no hay datos, limpiar estado
        localStorage.removeItem('vertimar_pedido_estado_completo');
      }
      
      window.location.href = '/inicio';
    } else {
      console.log('📴 [RegistrarPedido] Sin conexión para salir - Manteniendo en formulario offline');
      setLoadingConexion(false);
      
      
    }
  };

  const handleSalir = () => {
    // Guardar formulario antes de salir
    if (cliente || productos.length > 0 || observaciones.trim()) {
      saveForm();
      guardarEstadoCompleto();
    }
    handleSalirConVerificacion();
  };

  // ✅ DETERMINAR ESTADO DE INTERFAZ (con bloqueo)
  const getInterfaceState = () => {
    if (modoForzadoOffline || interfazLocked) {
      return {
        isOffline: true,
        showAsOffline: true,
        canGoOnline: false,
        locked: true
      };
    }
    
    return {
      isOffline: modoOffline,
      showAsOffline: modoOffline,
      canGoOnline: !modoOffline,
      locked: false
    };
  };

  const interfaceState = getInterfaceState();

  // ✅ OBTENER TEMA SEGÚN ESTADO DE INTERFAZ
  const getPageTheme = () => {
    if (!isPWA) return 'bg-gray-100'; // Web normal
    return interfaceState.showAsOffline ? 'bg-orange-50' : 'bg-gray-100';
  };

  const getHeaderTheme = () => {
    if (!isPWA) return 'from-blue-500 to-blue-600'; // Web normal
    return interfaceState.showAsOffline 
      ? 'from-orange-500 to-orange-600'    // Offline
      : 'from-blue-500 to-blue-600';       // Online
  };

  const getHeaderTitle = () => {
    if (!isPWA) return 'NUEVO PEDIDO';
    
    if (modoForzadoOffline) {
      return ' NUEVO PEDIDO OFFLINE';
    }
    
    return interfaceState.showAsOffline 
      ? 'NUEVO PEDIDO OFFLINE'
      : 'NUEVO PEDIDO ';
  };

  const getHeaderSubtitle = () => {
    if (!isPWA) return 'Sistema de gestión de pedidos';
    
    if (modoForzadoOffline) {
      return 'Modo offline ';
    }
    
    return interfaceState.showAsOffline
      ? 'Modo offline'
      : 'Sistema de gestión de pedidos';
  };

  // ✅ NO RENDERIZAR HASTA QUE ESTÉ INICIALIZADO
  if (!estadoInicializado) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Inicializando formulario...</p>
          <p className="text-xs text-gray-500 mt-2">Restaurando estado persistente</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen ${getPageTheme()} p-4`}>
      <Head>
        <title>VERTIMAR | REGISTRAR PEDIDO</title>
        <meta name="description" content="Sistema ultra estable con persistencia total del estado" />
      </Head>
      
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-6xl">
        
        {/* ✅ HEADER ULTRA ESTABLE */}
        <div className={`bg-gradient-to-r ${getHeaderTheme()} text-white rounded-lg p-6 mb-6`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                {getHeaderTitle()}
              </h1>
              <p className={interfaceState.showAsOffline ? 'text-orange-100' : 'text-blue-100'}>
                {getHeaderSubtitle()}
              </p>
              
              {/* ✅ INDICADOR DE ESTADO CON PERSISTENCIA */}
              {isPWA && (
                <div className="flex items-center gap-2 mt-2">
                  <div className={`w-3 h-3 rounded-full ${
                    interfaceState.showAsOffline ? 'bg-orange-300 animate-pulse' : 'bg-green-300 animate-pulse'
                  }`}></div>
                  <span className={`text-sm font-medium ${
                    interfaceState.showAsOffline ? 'text-orange-200' : 'text-green-200'
                  }`}>
                    {modoForzadoOffline 
                      ? 'MODO OFFLINE'
                      : interfaceState.showAsOffline 
                        ? 'MODO OFFLINE'
                        : 'MODO ONLINE'
                    }
                  </span>
                </div>
              )}
            </div>
            
            <div className="mt-4 md:mt-0 text-right">
              {/* ⚠️ BOTÓN EXPLÍCITO "ACTIVAR MODO ONLINE" - Con rollback automático */}
              {isPWA && modoForzadoOffline && (
                <button
                  onClick={async () => {
                    console.log('🔓 [RegistrarPedido] Usuario intenta activar modo online...');
                    setLoadingConexion(true);
                    
                    // ⚠️ ROLLBACK: Guardar estado actual antes de cambiar
                    const estadoAnterior = {
                      modoForzadoOffline,
                      interfazLocked
                    };
                    
                    try {
                      // Verificar conexión REAL antes de cambiar modo
                      const hayConexion = await verificarConexion();
                      
                      if (hayConexion) {
                        console.log('✅ [RegistrarPedido] Conexión confirmada - Activando modo online');
                        
                        // Cambiar modo
                        setModoForzadoOffline(false);
                        setInterfazLocked(false);
                        guardarEstadoCompleto();
                        toast.success('Modo online activado');
                      } else {
                        // ⚠️ ROLLBACK: Sin conexión, mantener modo offline
                        console.log('❌ [RegistrarPedido] Sin conexión real - Rollback a modo offline');
                        setModoForzadoOffline(estadoAnterior.modoForzadoOffline);
                        setInterfazLocked(estadoAnterior.interfazLocked);
                        toast.error('Sin conexión real. Manteniendo modo offline.');
                      }
                    } catch (error) {
                      // ⚠️ ROLLBACK: Error, volver a estado anterior
                      console.error('❌ [RegistrarPedido] Error verificando conexión - Rollback:', error);
                      setModoForzadoOffline(estadoAnterior.modoForzadoOffline);
                      setInterfazLocked(estadoAnterior.interfazLocked);
                      toast.error('Error verificando conexión. Manteniendo modo offline.');
                    } finally {
                      setLoadingConexion(false);
                    }
                  }}
                  disabled={loadingConexion}
                  className={`mb-2 px-4 py-2 rounded text-sm font-medium transition-colors ${
                    loadingConexion
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : 'bg-green-500 hover:bg-green-600 text-white shadow-md'
                  }`}
                >
                  {loadingConexion ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verificando...
                    </span>
                  ) : (
                    '🌐 Activar Modo Online'
                  )}
                </button>
              )}
              
              <p className={interfaceState.showAsOffline ? 'text-orange-100' : 'text-blue-100'}>
                {new Date().toLocaleDateString('es-AR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        
        
        {/* ✅ SELECTORES HÍBRIDOS (funcionan online/offline automáticamente) */}
        <div className="flex flex-col md:flex-row gap-6">
          <ClienteSelectorHybrid />
          <ProductoSelectorHybrid />
        </div>

        {/* ✅ CARRITO HÍBRIDO */}
        <ProductosCarrito />

        {/* ✅ OBSERVACIONES */}
        <ObservacionesPedido />
        
        {/* ✅ RESUMEN Y BOTONES ULTRA ESTABLES */}
        <div className={`mt-6 p-4 rounded-lg border ${
          interfaceState.showAsOffline ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <div className="text-lg font-semibold text-gray-800">
              <p>Total de productos: <span className="text-blue-600">{totalProductos}</span></p>
              <p>Total del pedido: <span className="text-green-600">${total.toFixed(2)}</span></p>
              
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-end gap-4">
            <button 
              className={`px-6 py-3 rounded text-white font-semibold transition-colors ${
                loading 
                  ? 'bg-gray-500 cursor-not-allowed' 
                  : interfaceState.showAsOffline
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'bg-green-600 hover:bg-green-700'
              }`}
              onClick={handleConfirmarPedido}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {interfaceState.showAsOffline ? 'Guardando offline...' : 'Procesando...'}
                </div>
              ) : (
                interfaceState.showAsOffline 
                  ? 'Guardar Pedido Offline'
                  : 'Confirmar Pedido'
              )}
            </button>
            
            <button 
              className={`px-6 py-3 rounded text-white font-semibold transition-colors ${
                loadingConexion 
                  ? 'bg-gray-500 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
              onClick={handleConfirmarSalida}
              disabled={loading || loadingConexion}
            >
              {loadingConexion ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verificando conexión...
                </div>
              ) : (
                'Volver al Inicio'
              )}
            </button>
          </div>
        </div>

        
      </div>
      
      {/* ✅ MODAL DE CONFIRMACIÓN UNIVERSAL */}
      <ModalConfirmacionPedido
        mostrar={mostrarConfirmacion}
        cliente={cliente}
        totalProductos={totalProductos}
        total={total}
        observaciones={observaciones}
        onConfirmar={handleRegistrarPedido}
        onCancelar={() => setMostrarConfirmacion(false)}
        loading={loading}
        isPWA={isPWA}
        isOnline={!interfaceState.showAsOffline}
      />

      <ModalConfirmacionSalidaPedidos
        mostrar={mostrarConfirmacionSalida}
        onConfirmar={handleSalir}
        onCancelar={() => setMostrarConfirmacionSalida(false)}
      />

      {/* ✅ MODAL DE RECONEXIÓN ULTRA ESTABLE */}
      <ModalConexionRestablecida
        mostrar={mostrarModalReconexion}
        onIrAMenu={handleIrAMenuDesdeModal}
        onSeguirRegistrando={handleSeguirRegistrandoDesdeModal}
        loading={loadingConexion}
      />
    </div>
  );
}

export default function RegistrarPedido() {
  return (
    <PedidosProvider>
      <RegistrarPedidoContent />
    </PedidosProvider>
  );
}