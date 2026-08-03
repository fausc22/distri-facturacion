import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import toast from '@/components/shared/toast';
import { useRouter } from 'next/router';
import useAuth from '../../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import PageBreadcrumbs from '@/components/shared/PageBreadcrumbs';

import { PedidosProvider, usePedidosContext } from '../../context/PedidosContext';
import { useVentaDirecta } from '../../hooks/ventas/useVentaDirecta';

// Componentes reutilizados (SIN híbridos)
import ClienteSelector from '../../components/pedidos/SelectorClientes';
import ProductoSelector from '../../components/pedidos/SelectorProductos';
import ProductosCarrito from '../../components/pedidos/ProductosCarrito';
import ObservacionesPedido from '../../components/pedidos/ObservacionesPedido';
import PedidoFormActionBar from '../../components/pedidos/PedidoFormActionBar';

// Modales específicos de venta directa
const ModalConfirmacionVentaDirecta = dynamic(
  () =>
    import('../../components/ventas/ModalesVentaDirecta').then((m) => ({
      default: m.ModalConfirmacionVentaDirecta,
    })),
  { ssr: false }
);
const ModalFacturacionVentaDirecta = dynamic(
  () =>
    import('../../components/ventas/ModalesVentaDirecta').then((m) => ({
      default: m.ModalFacturacionVentaDirecta,
    })),
  { ssr: false }
);

function VentaDirectaContent() {
  const { 
    cliente, 
    productos, 
    observaciones,
    subtotal,
    totalIva,
    total, 
    totalProductos,
    clearPedido,
    getDatosPedido
  } = usePedidosContext();
 
  const { registrarVentaDirecta, loading } = useVentaDirecta();
  const { user } = useAuth();
  const router = useRouter();

  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [mostrarModalFacturacion, setMostrarModalFacturacion] = useState(false);
  const [mostrarConfirmacionSalida, setMostrarConfirmacionSalida] = useState(false);

  // Verificar que sea gerente
  useEffect(() => {
    if (user && user.rol !== 'GERENTE') {
      toast.error('Solo los gerentes pueden realizar ventas directas', {
        duration: 5000,
        icon: '🔒'
      });
      router.push('/inicio');
    }
  }, [user, router]);

  // Bloquear acceso si no es gerente
  if (!user || user.rol !== 'GERENTE') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Acceso Restringido</h2>
          <p className="text-gray-600 mb-6">
            Solo los gerentes pueden acceder a la funcionalidad de venta directa.
          </p>
          <button
            onClick={() => router.push('/inicio')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-semibold transition-colors"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  const handleAbrirConfirmacion = () => {
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

  const handleContinuarAFacturacion = () => {
    setMostrarConfirmacion(false);
    setMostrarModalFacturacion(true);
  };

  const handleConfirmarVenta = async (datosFacturacion) => {
    const datosPedido = getDatosPedido();
    
    // Preparar datos completos para el backend
    const datosCompletos = {
      // Datos del cliente
      cliente_id: cliente.id,
      cliente_nombre: cliente.nombre,
      cliente_telefono: cliente.telefono || '',
      cliente_direccion: cliente.direccion || '',
      cliente_ciudad: cliente.ciudad || '',
      cliente_provincia: cliente.provincia || '',
      cliente_condicion: cliente.condicion_iva || '',
      cliente_cuit: cliente.cuit || '',
      
      // Datos de productos (incluye líneas normales y eventuales líneas de flete con nombre/precio personalizados)
      productos: productos.map(p => ({
        id: p.id,
        nombre: p.nombre,
        unidad_medida: p.unidad_medida || 'Unidad',
        cantidad: p.cantidad,
        precio: parseFloat(p.precio) || 0,
        iva: parseFloat(p.iva_calculado) || 0,
        subtotal: parseFloat(p.subtotal) || 0,
        descuento_porcentaje: parseFloat(p.descuento_porcentaje || 0),
        // Compatibilidad con modo manual de precio (backend ignora si no lo usa)
        precio_incluye_iva: Boolean(p.precio_incluye_iva),
        precio_unitario_final_manual:
          p.precio_unitario_final_manual !== undefined &&
          p.precio_unitario_final_manual !== null
            ? parseFloat(p.precio_unitario_final_manual)
            : null
      })),
      
      // Datos de facturación
      cuentaId: datosFacturacion.cuentaId,
      tipoFiscal: datosFacturacion.tipoFiscal,
      subtotalSinIva: datosFacturacion.subtotalSinIva,
      ivaTotal: datosFacturacion.ivaTotal,
      totalConIva: datosFacturacion.totalConIva,
      descuentoAplicado: datosFacturacion.descuentoAplicado,
      
      // Observaciones y empleado
      observaciones: observaciones || 'sin observaciones',
      empleado_id: user?.id || 1,
      empleado_nombre: user?.nombre || 'Usuario'
    };
    
    console.log('💰 Enviando venta directa completa:', datosCompletos);
    
    const resultado = await registrarVentaDirecta(datosCompletos);
    
    if (resultado.success) {
      clearPedido();
      setMostrarModalFacturacion(false);
      
      toast.success(
        `Venta directa completada:\n` +
        `Pedido #${resultado.data.pedidoId}\n` +
        `Venta #${resultado.data.ventaId}\n` +
        `Remito #${resultado.data.remitoId}`,
        {
          duration: 6000,
          icon: '🎉'
        }
      );
      
      // Opcional: Redirigir después de 2 segundos
      setTimeout(() => {
        router.push('/inicio');
      }, 2000);
    }
  };

  const handleCancelarConfirmacion = () => {
    setMostrarConfirmacion(false);
  };

  const handleCancelarFacturacion = () => {
    setMostrarModalFacturacion(false);
  };

  const handleVolver = () => {
    if (cliente || productos.length > 0 || observaciones.trim()) {
      setMostrarConfirmacionSalida(true);
    } else {
      router.push('/inicio');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-muted/30 p-4">
      <Head>
        <title>VERTIMAR | VENTA DIRECTA</title>
        <meta name="description" content="Sistema de venta directa - Solo gerentes" />
      </Head>

      <Card className="w-full max-w-6xl shadow-lg">
        <CardHeader className="border-b bg-primary text-primary-foreground rounded-t-lg">
          <CardTitle className="text-2xl">VENTA DIRECTA</CardTitle>
          <p className="text-sm opacity-90">
            {new Date().toLocaleDateString('es-AR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </CardHeader>
        <CardContent className="pt-6">
        <PageBreadcrumbs />
        <div className="flex flex-col md:flex-row gap-6">
          <ClienteSelector />
          <ProductoSelector mostrarPreciosConIva mostrarBotonFletes />
        </div>

        <ProductosCarrito mostrarResumen={false} />
        <ObservacionesPedido />

        <PedidoFormActionBar
          totalProductos={totalProductos}
          subtotal={subtotal}
          totalIva={totalIva}
          total={total}
          primaryLabel="Registrar venta directa"
          secondaryLabel="Volver al inicio"
          onPrimary={handleAbrirConfirmacion}
          onSecondary={handleVolver}
          loading={loading}
          className="md:border md:rounded-lg md:bg-muted/30"
        />
        </CardContent>
      </Card>
      
      {/* Modal de confirmación inicial */}
      <ModalConfirmacionVentaDirecta
        mostrar={mostrarConfirmacion}
        cliente={cliente}
        totalProductos={totalProductos}
        total={total}
        onConfirmar={handleContinuarAFacturacion}
        onCancelar={handleCancelarConfirmacion}
        loading={false}
      />

      {/* Modal de facturación */}
      <ModalFacturacionVentaDirecta
        mostrar={mostrarModalFacturacion}
        onClose={handleCancelarFacturacion}
        cliente={cliente}
        productos={productos}
        onConfirmarVenta={handleConfirmarVenta}
      />

      <ConfirmModal
        open={mostrarConfirmacionSalida}
        onOpenChange={setMostrarConfirmacionSalida}
        title="Salir de Venta Directa"
        description="Hay datos cargados sin guardar. Si salís ahora, se perderán."
        confirmLabel="Salir igualmente"
        cancelLabel="Seguir editando"
        variant="danger"
        onConfirm={() => router.push('/inicio')}
      />
    </div>
  );
}

export default function VentaDirecta() {
  return (
    <PedidosProvider>
      <VentaDirectaContent />
    </PedidosProvider>
  );
}