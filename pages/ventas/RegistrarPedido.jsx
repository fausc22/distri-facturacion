import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import toast from '@/components/shared/toast';
import useAuth from '../../hooks/useAuth';
import { PedidosProvider, usePedidosContext } from '../../context/PedidosContext';
import { usePedidosHybrid } from '../../hooks/pedidos/usePedidosHybrid';
import { useConnectionContext } from '../../context/ConnectionContext';
import { offlineManager } from '../../utils/offlineManager';
import { usePedidosFormPersistence } from '../../hooks/useFormPersistence';
import { usePedidosUIStore } from '@/stores/pedidosUIStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/shared/StateViews';
import PageBreadcrumbs from '@/components/shared/PageBreadcrumbs';
import { Loader2, WifiOff } from 'lucide-react';

import ClienteSelectorHybrid from '../../components/pedidos/SelectorClientesHybrid';
import ProductoSelectorHybrid from '../../components/pedidos/SelectorProductosHybrid';
import ProductosCarrito from '../../components/pedidos/ProductosCarrito';
import ObservacionesPedido from '../../components/pedidos/ObservacionesPedido';
import PedidoFormActionBar from '../../components/pedidos/PedidoFormActionBar';

const ModalConfirmacionPedido = dynamic(
  () =>
    import('../../components/pedidos/ModalesConfirmacion').then((m) => ({
      default: m.ModalConfirmacionPedido,
    })),
  { ssr: false }
);
const ModalConfirmacionSalidaPedidos = dynamic(
  () =>
    import('../../components/pedidos/ModalesConfirmacion').then((m) => ({
      default: m.ModalConfirmacionSalidaPedidos,
    })),
  { ssr: false }
);

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
    addMultipleProductos,
  } = usePedidosContext();

  const { registrarPedido, loading } = usePedidosHybrid();
  const { user } = useAuth();
  const { modales, openModal, closeModal, banners } = usePedidosUIStore();

  const [estadoInicializado, setEstadoInicializado] = useState(false);
  const inicializacionCompletada = useRef(false);
  const formRestaurado = useRef(false);

  const { modoOffline, reconectando, reconectar, isPWA } = useConnectionContext();

  const { saveForm, restoreForm, clearSavedForm, hasSavedForm } = usePedidosFormPersistence({
    cliente,
    productos,
    observaciones,
    subtotal,
    totalIva,
    total,
    totalProductos,
  });

  const guardarEstadoCompleto = () => {
    if (!estadoInicializado) return;
    try {
      const estadoCompleto = {
        cliente,
        productos,
        observaciones,
        timestamp: Date.now(),
        route: '/ventas/RegistrarPedido',
      };
      localStorage.setItem('vertimar_pedido_estado_completo', JSON.stringify(estadoCompleto));
    } catch (error) {
      console.error('Error guardando formulario:', error);
    }
  };

  const restaurarEstadoCompleto = () => {
    if (formRestaurado.current) return false;
    try {
      const estadoGuardado = localStorage.getItem('vertimar_pedido_estado_completo');
      if (!estadoGuardado) return false;
      const estado = JSON.parse(estadoGuardado);
      const horasTranscurridas = (Date.now() - estado.timestamp) / (1000 * 60 * 60);
      if (horasTranscurridas > 24) {
        localStorage.removeItem('vertimar_pedido_estado_completo');
        return false;
      }
      if (estado.cliente) setCliente(estado.cliente);
      if (estado.productos?.length > 0) addMultipleProductos(estado.productos);
      if (estado.observaciones) setObservaciones(estado.observaciones);
      formRestaurado.current = true;
      return true;
    } catch (error) {
      console.error('Error restaurando formulario:', error);
      return false;
    }
  };

  useEffect(() => {
    if (inicializacionCompletada.current) return;
    restaurarEstadoCompleto();
    setEstadoInicializado(true);
    inicializacionCompletada.current = true;
  }, []);

  useEffect(() => {
    if (!estadoInicializado || formRestaurado.current) return;
    if (hasSavedForm()) {
      const savedData = restoreForm();
      if (savedData) {
        if (savedData.cliente && !cliente) setCliente(savedData.cliente);
        if (savedData.observaciones && !observaciones) setObservaciones(savedData.observaciones);
        if (savedData.productos?.length > 0 && productos.length === 0)
          addMultipleProductos(savedData.productos);
        clearSavedForm();
        formRestaurado.current = true;
      }
    }
  }, [estadoInicializado]);

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

  useEffect(() => {
    if (estadoInicializado) guardarEstadoCompleto();
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
    openModal('confirmacionPedido');
  };

  const handleRegistrarPedido = async () => {
    const datosPedido = getDatosPedido();
    const datosCompletos = { ...datosPedido, empleado: user };
    const resultado = await registrarPedido(datosCompletos, modoOffline);

    if (resultado.success) {
      clearSavedForm();
      localStorage.removeItem('vertimar_pedido_estado_completo');
      clearPedido();
      closeModal('confirmacionPedido');
      formRestaurado.current = false;
    }
  };

  const handleReconectarApp = async () => {
    await reconectar();
  };

  const handleConfirmarSalida = () => {
    if (cliente || productos.length > 0 || observaciones.trim()) {
      openModal('confirmacionSalida');
    } else {
      handleSalir();
    }
  };

  const handleSalir = () => {
    if (cliente || productos.length > 0 || observaciones.trim()) {
      saveForm();
      guardarEstadoCompleto();
    } else {
      localStorage.removeItem('vertimar_pedido_estado_completo');
    }
    window.location.href = '/inicio';
  };

  const estaEnModoOffline = isPWA && modoOffline;

  if (!estadoInicializado) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4">
        <LoadingState message="Inicializando formulario..." />
        <p className="mt-2 text-xs text-muted-foreground">Restaurando estado persistente</p>
      </div>
    );
  }

  return (
    <div
      className={`flex min-h-screen flex-col p-4 ${estaEnModoOffline ? 'bg-amber-50/50' : 'bg-muted/30'}`}
    >
      <Head>
        <title>VERTIMAR | REGISTRAR PEDIDO</title>
        <meta name="description" content="Sistema de registro de pedidos offline-first" />
      </Head>

      <Card className="mx-auto w-full max-w-6xl shadow-lg">
        <CardHeader
          className={
            estaEnModoOffline
              ? 'rounded-t-lg bg-gradient-to-r from-amber-500 to-amber-600 text-white'
              : 'rounded-t-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground'
          }
        >
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <CardTitle className="text-2xl md:text-3xl">
                {!isPWA
                  ? 'NUEVO PEDIDO'
                  : estaEnModoOffline
                    ? 'NUEVO PEDIDO OFFLINE'
                    : 'NUEVO PEDIDO'}
              </CardTitle>
              <CardDescription
                className={estaEnModoOffline ? 'text-amber-100' : 'text-primary-foreground/80'}
              >
                {estaEnModoOffline
                  ? 'Trabajando sin conexión - Datos desde IndexedDB'
                  : 'Sistema de gestión de pedidos'}
              </CardDescription>
              {isPWA && (
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`inline-block h-2.5 w-2.5 rounded-full ${
                      estaEnModoOffline ? 'animate-pulse bg-amber-200' : 'animate-pulse bg-emerald-300'
                    }`}
                  />
                  <span className="text-sm font-medium">
                    {estaEnModoOffline ? 'MODO OFFLINE' : 'MODO ONLINE'}
                  </span>
                </div>
              )}
            </div>
            <p className={estaEnModoOffline ? 'text-amber-100' : 'text-primary-foreground/80'}>
              {new Date().toLocaleDateString('es-AR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <PageBreadcrumbs />
          {estaEnModoOffline && banners.offlineReconnect && (
            <Card className="mb-6 border-amber-500 bg-amber-50 shadow-md">
              <CardContent className="flex flex-col items-center justify-between gap-4 p-6 md:flex-row">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-amber-100 p-3">
                    <WifiOff className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Modo Offline Activo</h3>
                    <p className="text-sm text-muted-foreground">
                      Los pedidos se guardan localmente. Toque el botón cuando tenga conexión
                      estable.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleReconectarApp}
                  disabled={reconectando}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  {reconectando ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Reconectando...
                    </>
                  ) : (
                    'Reconectar App'
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col gap-6 md:flex-row">
            <ClienteSelectorHybrid />
            <ProductoSelectorHybrid mostrarPreciosConIva />
          </div>

          <ProductosCarrito mostrarResumen={false} />
          <ObservacionesPedido />

          <PedidoFormActionBar
            totalProductos={totalProductos}
            subtotal={subtotal}
            totalIva={totalIva}
            total={total}
            primaryLabel={estaEnModoOffline ? 'Guardar Pedido Offline' : 'Confirmar Pedido'}
            secondaryLabel="Volver al Inicio"
            onPrimary={handleConfirmarPedido}
            onSecondary={handleConfirmarSalida}
            loading={loading}
            variant={estaEnModoOffline ? 'offline' : 'default'}
            className="md:border md:rounded-lg md:bg-muted/30"
          />
        </CardContent>
      </Card>

      {modales.confirmacionPedido && (
        <ModalConfirmacionPedido
          mostrar
          cliente={cliente}
          totalProductos={totalProductos}
          subtotal={subtotal}
          totalIva={totalIva}
          total={total}
          observaciones={observaciones}
          onConfirmar={handleRegistrarPedido}
          onCancelar={() => closeModal('confirmacionPedido')}
          loading={loading}
          isPWA={isPWA}
          isOnline={!estaEnModoOffline}
        />
      )}

      {modales.confirmacionSalida && (
        <ModalConfirmacionSalidaPedidos
          mostrar
          onConfirmar={handleSalir}
          onCancelar={() => closeModal('confirmacionSalida')}
        />
      )}
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
