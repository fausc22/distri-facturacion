import { useState, useEffect } from 'react';
import Head from 'next/head';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/router';
import useAuth from '../../hooks/useAuth';

import { PedidosProvider, usePedidosContext } from '../../context/PedidosContext';
import { useVentaDirecta } from '../../hooks/ventas/useVentaDirecta';

// Componentes reutilizados (SIN híbridos)
import ClienteSelector from '../../components/pedidos/SelectorClientes';
import ProductoSelector from '../../components/pedidos/SelectorProductos';
import ProductosCarrito from '../../components/pedidos/ProductosCarrito';
import ObservacionesPedido from '../../components/pedidos/ObservacionesPedido';

// Modales específicos de venta directa
import { 
  ModalConfirmacionVentaDirecta,
  ModalFacturacionVentaDirecta
} from '../../components/ventas/ModalesVentaDirecta';

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
      
      // Datos de productos
      productos: productos.map(p => ({
        id: p.id,
        nombre: p.nombre,
        unidad_medida: p.unidad_medida || 'Unidad',
        cantidad: p.cantidad,
        precio: parseFloat(p.precio),
        iva: parseFloat(p.iva_calculado),
        subtotal: parseFloat(p.subtotal),
        descuento_porcentaje: parseFloat(p.descuento_porcentaje || 0) // ✅ AGREGAR DESCUENTO
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
      if (window.confirm('¿Está seguro de que desea salir? Se perderán los datos ingresados.')) {
        router.push('/inicio');
      }
    } else {
      router.push('/inicio');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <Head>
        <title>VERTIMAR | VENTA DIRECTA</title>
        <meta name="description" content="Sistema de venta directa - Solo gerentes" />
      </Head>
      
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-6xl">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                💰 VENTA DIRECTA
              </h1>
              
              
            </div>
            
            <div className="mt-4 md:mt-0 text-right">
              <p className="text-green-100">
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

        
        
        {/* Selectores */}
        <div className="flex flex-col md:flex-row gap-6">
          <ClienteSelector />
          <ProductoSelector mostrarPreciosConIva />
        </div>

        {/* Carrito */}
        <ProductosCarrito />

        {/* Observaciones */}
        <ObservacionesPedido />
        
        {/* Resumen y Botones */}
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <div className="text-lg font-semibold text-gray-800">
              <p>Total de productos: <span className="text-blue-600">{totalProductos}</span></p>
              <p>Subtotal sin IVA: <span className="text-gray-700">${subtotal.toFixed(2)}</span></p>
              <p>IVA total: <span className="text-gray-700">${totalIva.toFixed(2)}</span></p>
              <p>Total final de la venta: <span className="text-green-600">${total.toFixed(2)}</span></p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-end gap-4">
            <button 
              className={`px-6 py-3 rounded text-white font-semibold transition-colors ${
                loading 
                  ? 'bg-gray-500 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
              onClick={handleAbrirConfirmacion}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </div>
              ) : (
                '💰 REGISTRAR VENTA DIRECTA'
              )}
            </button>
            
            <button 
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded font-semibold transition-colors"
              onClick={handleVolver}
              disabled={loading}
            >
              ❌ VOLVER AL INICIO
            </button>
          </div>
        </div>
      </div>
      
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