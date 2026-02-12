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

function RegistrarPedidoContent() {
  const { 
    cliente, 
    productos, 
    observaciones,
    subtotal,
    totalIva,
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

  // ✅ ESTADOS PARA PERSISTENCIA
  const [estadoInicializado, setEstadoInicializado] = useState(false);
  
  // ✅ REF PARA EVITAR MÚLTIPLES INICIALIZACIONES
  const inicializacionCompletada = useRef(false);
  const formRestaurado = useRef(false);

  // ✅ CONEXIÓN CENTRALIZADA - ÚNICA FUENTE DE VERDAD
  const { modoOffline, reconectando, reconectar, isPWA } = useConnectionContext();

  // ✅ FORM PERSISTENCE
  const {
    saveForm,
    restoreForm,
    clearSavedForm,
    hasSavedForm
  } = usePedidosFormPersistence({
    cliente,
    productos,
    observaciones,
    subtotal,
    totalIva,
    total,
    totalProductos
  });

  // ✅ PERSISTENCIA DEL FORMULARIO
  const guardarEstadoCompleto = () => {
    if (!estadoInicializado) return;
    
    try {
      const estadoCompleto = {
        cliente,
        productos,
        observaciones,
        timestamp: Date.now(),
        route: '/ventas/RegistrarPedido'
      };
      
      localStorage.setItem('vertimar_pedido_estado_completo', JSON.stringify(estadoCompleto));
      console.log('💾 [RegistrarPedido] Formulario guardado');
    } catch (error) {
      console.error('❌ [RegistrarPedido] Error guardando formulario:', error);
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
        console.log('⏰ [RegistrarPedido] Estado guardado muy antiguo, descartando');
        localStorage.removeItem('vertimar_pedido_estado_completo');
        return false;
      }
      
      console.log('🔄 [RegistrarPedido] Restaurando formulario desde localStorage');
      
      if (estado.cliente) setCliente(estado.cliente);
      if (estado.productos?.length > 0) addMultipleProductos(estado.productos);
      if (estado.observaciones) setObservaciones(estado.observaciones);
      
      formRestaurado.current = true;
      return true;
    } catch (error) {
      console.error('❌ [RegistrarPedido] Error restaurando formulario:', error);
      return false;
    }
  };

  // ✅ INICIALIZACIÓN
  useEffect(() => {
    if (inicializacionCompletada.current) return;

    console.log('🚀 [RegistrarPedido] Inicializando...');
    console.log(`📱 [RegistrarPedido] Modo: ${isPWA ? 'PWA' : 'Web'}, Offline: ${modoOffline}`);

    // Restaurar formulario guardado
    restaurarEstadoCompleto();

    setEstadoInicializado(true);
    inicializacionCompletada.current = true;

    console.log('✅ [RegistrarPedido] Inicialización completada');
  }, []);

  // ✅ CARGAR ESTADÍSTICAS PWA
  useEffect(() => {
    if (isPWA) {
      const stats = offlineManager.getStorageStats();
      setCatalogStats(stats);
    }
  }, [isPWA]);

  // ✅ AUTO-RESTORE FALLBACK
  useEffect(() => {
    if (!estadoInicializado || formRestaurado.current) return;
    
    if (hasSavedForm()) {
      console.log('🔄 [RegistrarPedido] Usando sistema de persistencia fallback');
      const savedData = restoreForm();
      
      if (savedData) {
        if (savedData.cliente && !cliente) setCliente(savedData.cliente);
        if (savedData.observaciones && !observaciones) setObservaciones(savedData.observaciones);
        if (savedData.productos?.length > 0 && productos.length === 0) addMultipleProductos(savedData.productos);
        
        clearSavedForm();
        formRestaurado.current = true;
      }
    }
  }, [estadoInicializado]);

  // ✅ AUTO-SAVE cada 10 segundos
  useEffect(() => {
    if (!estadoInicializado) return;
    
    if (cliente || productos.length > 0 || observaciones.trim()) {
      const interval = setInterval(() => {
        saveForm();
        guardarEstadoCompleto();
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [cliente, productos, observaciones, estadoInicializado, saveForm]);

  // ✅ GUARDAR EN CADA CAMBIO
  useEffect(() => {
    if (estadoInicializado) {
      guardarEstadoCompleto();
    }
  }, [cliente, productos, observaciones, estadoInicializado]);

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

  // ✅ REGISTRAR PEDIDO - Usa modoOffline del ConnectionContext
  const handleRegistrarPedido = async () => {
    const datosPedido = getDatosPedido();
    const datosCompletos = {
      ...datosPedido,
      empleado: user
    };
    
    console.log(`🔄 [RegistrarPedido] Registrando pedido - Modo offline: ${modoOffline}`);
    
    // Pasar modoOffline al hook (del ConnectionContext)
    const resultado = await registrarPedido(datosCompletos, modoOffline);
    
    if (resultado.success) {
      // Limpiar formulario
      clearSavedForm();
      localStorage.removeItem('vertimar_pedido_estado_completo');
      clearPedido();
      setMostrarConfirmacion(false);
      formRestaurado.current = false;
      
      console.log('🧹 [RegistrarPedido] Formulario limpiado después de guardar pedido');
      
      // Actualizar estadísticas
      if (isPWA) {
        const newStats = offlineManager.getStorageStats();
        setCatalogStats(newStats);
      }
      
      // El toast ya se mostró en el hook
    } else {
      console.error('❌ [RegistrarPedido] Error registrando pedido:', resultado.error);
    }
  };

  // ✅ HANDLER DE RECONEXIÓN - Usa el Context centralizado (igual que en Home)
  const handleReconectarApp = async () => {
    await reconectar();
  };

  // ✅ MANEJAR "VOLVER AL INICIO"
  const handleConfirmarSalida = () => {
    if (cliente || productos.length > 0 || observaciones.trim()) {
      setMostrarConfirmacionSalida(true);
    } else {
      handleSalir();
    }
  };

  const handleSalir = () => {
    // Guardar formulario antes de salir
    if (cliente || productos.length > 0 || observaciones.trim()) {
      saveForm();
      guardarEstadoCompleto();
    } else {
      localStorage.removeItem('vertimar_pedido_estado_completo');
    }
    
    window.location.href = '/inicio';
  };

  // ✅ ESTADO DE INTERFAZ - Basado en modoOffline del ConnectionContext
  const estaEnModoOffline = isPWA && modoOffline;

  // ✅ TEMAS SEGÚN ESTADO DE CONEXIÓN
  const getPageTheme = () => {
    if (!isPWA) return 'bg-gray-100';
    return estaEnModoOffline ? 'bg-orange-50' : 'bg-gray-100';
  };

  const getHeaderTheme = () => {
    if (!isPWA) return 'from-blue-500 to-blue-600';
    return estaEnModoOffline ? 'from-orange-500 to-orange-600' : 'from-blue-500 to-blue-600';
  };

  const getHeaderTitle = () => {
    if (!isPWA) return 'NUEVO PEDIDO';
    return estaEnModoOffline ? '📴 NUEVO PEDIDO OFFLINE' : '✅ NUEVO PEDIDO';
  };

  const getHeaderSubtitle = () => {
    if (!isPWA) return 'Sistema de gestión de pedidos';
    return estaEnModoOffline ? 'Trabajando sin conexión - Datos desde IndexedDB' : 'Sistema de gestión de pedidos';
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
        <meta name="description" content="Sistema de registro de pedidos offline-first" />
      </Head>
      
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-6xl">
        
        {/* ✅ HEADER */}
        <div className={`bg-gradient-to-r ${getHeaderTheme()} text-white rounded-lg p-6 mb-6`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                {getHeaderTitle()}
              </h1>
              <p className={estaEnModoOffline ? 'text-orange-100' : 'text-blue-100'}>
                {getHeaderSubtitle()}
              </p>
              
              {/* ✅ INDICADOR DE ESTADO */}
              {isPWA && (
                <div className="flex items-center gap-2 mt-2">
                  <div className={`w-3 h-3 rounded-full ${
                    estaEnModoOffline ? 'bg-orange-300 animate-pulse' : 'bg-green-300 animate-pulse'
                  }`}></div>
                  <span className={`text-sm font-medium ${
                    estaEnModoOffline ? 'text-orange-200' : 'text-green-200'
                  }`}>
                    {estaEnModoOffline ? 'MODO OFFLINE' : 'MODO ONLINE'}
                  </span>
                </div>
              )}
            </div>
            
            <div className="mt-4 md:mt-0 text-right">
              <p className={estaEnModoOffline ? 'text-orange-100' : 'text-blue-100'}>
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

        {/* ✅ BOTÓN "RECONECTAR APP" - Solo visible en modo offline (igual que en Home) */}
        {estaEnModoOffline && (
          <div className="mb-6 border-2 rounded-xl p-6 shadow-lg bg-orange-50 border-orange-500">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-orange-100">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Modo Offline Activo
                  </h3>
                  <p className="text-sm text-gray-600">
                    Los pedidos se guardan localmente. Toque el botón cuando tenga conexión estable.
                  </p>
                </div>
              </div>
              <button
                onClick={handleReconectarApp}
                disabled={reconectando}
                className={`px-6 py-3 rounded-lg font-semibold text-white transition-all ${
                  reconectando
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-orange-600 hover:bg-orange-700 shadow-md hover:shadow-lg'
                }`}
              >
                {reconectando ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Reconectando...
                  </span>
                ) : (
                  '🔄 RECONECTAR APP'
                )}
              </button>
            </div>
          </div>
        )}

        
        
        {/* ✅ SELECTORES HÍBRIDOS (funcionan online/offline automáticamente) */}
        <div className="flex flex-col md:flex-row gap-6">
          <ClienteSelectorHybrid />
          <ProductoSelectorHybrid mostrarPreciosConIva />
        </div>

        {/* ✅ CARRITO HÍBRIDO */}
        <ProductosCarrito />

        {/* ✅ OBSERVACIONES */}
        <ObservacionesPedido />
        
        {/* ✅ RESUMEN Y BOTONES */}
        <div className={`mt-6 p-4 rounded-lg border ${
          estaEnModoOffline ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <div className="text-lg font-semibold text-gray-800">
              <p>Total de productos: <span className="text-blue-600">{totalProductos}</span></p>
              <p>Subtotal sin IVA: <span className="text-gray-700">${subtotal.toFixed(2)}</span></p>
              <p>IVA total: <span className="text-gray-700">${totalIva.toFixed(2)}</span></p>
              <p>Total final del pedido: <span className="text-green-600">${total.toFixed(2)}</span></p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-end gap-4">
            <button 
              className={`px-6 py-3 rounded text-white font-semibold transition-colors ${
                loading 
                  ? 'bg-gray-500 cursor-not-allowed' 
                  : estaEnModoOffline
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
                  {estaEnModoOffline ? 'Guardando offline...' : 'Procesando...'}
                </div>
              ) : (
                estaEnModoOffline 
                  ? '📱 Guardar Pedido Offline'
                  : '✅ Confirmar Pedido'
              )}
            </button>
            
            <button 
              className="px-6 py-3 rounded text-white font-semibold transition-colors bg-red-600 hover:bg-red-700"
              onClick={handleConfirmarSalida}
              disabled={loading}
            >
              Volver al Inicio
            </button>
          </div>
        </div>
      </div>
      
      {/* ✅ MODALES */}
      <ModalConfirmacionPedido
        mostrar={mostrarConfirmacion}
        cliente={cliente}
        totalProductos={totalProductos}
        subtotal={subtotal}
        totalIva={totalIva}
        total={total}
        observaciones={observaciones}
        onConfirmar={handleRegistrarPedido}
        onCancelar={() => setMostrarConfirmacion(false)}
        loading={loading}
        isPWA={isPWA}
        isOnline={!estaEnModoOffline}
      />

      <ModalConfirmacionSalidaPedidos
        mostrar={mostrarConfirmacionSalida}
        onConfirmar={handleSalir}
        onCancelar={() => setMostrarConfirmacionSalida(false)}
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