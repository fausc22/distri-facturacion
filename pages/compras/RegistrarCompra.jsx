import Head from 'next/head';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import toast from '@/components/shared/toast';
import useAuth from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PanelCard } from '@/components/shared/PanelCard';
import { CompraProvider, useCompra } from '@/context/ComprasContext';
import { useComprasUIStore } from '@/stores/comprasUIStore';
import { useRegistrarCompra } from '@/hooks/compra/useRegistrarCompra';
import SelectorProveedores from '@/components/compra/SelectorProveedores';
import SelectorProductosCompra from '@/components/compra/SelectorProductosCompra';
import ProductosCarritoCompra from '@/components/compra/ProductosCarritoCompras';
import { ModalConfirmacionCompraCompleto } from '@/components/compra/ModalConfirmacionCompraCompleto';
import { BotonAccionesCompra } from '@/components/compra/BotonAccionesCompra';
import { ConfirmModal } from '@/components/shared/ConfirmModal';

function RegistrarCompraContent() {
  const { user } = useAuth();
  const router = useRouter();
  const { proveedor, productos, total, clearCompra } = useCompra();
  const { registrarCompra, loading } = useRegistrarCompra();
  const { modales, openModal, closeModal } = useComprasUIStore();

  useEffect(() => {
    if (user && user.rol !== 'GERENTE') {
      router.push('/inicio');
    }
  }, [user, router]);

  const handleConfirmarCompra = () => {
    if (!proveedor) {
      toast.error('Debe seleccionar un proveedor');
      return;
    }
    if (productos.length === 0) {
      toast.error('Debe agregar al menos un producto');
      return;
    }
    openModal('confirmacionCompra');
  };

  const handleRegistrarCompra = async (datosCompraCompletos) => {
    try {
      const resultado = await registrarCompra(datosCompraCompletos);
      if (resultado.success) {
        clearCompra();
        closeModal('confirmacionCompra');
        if (resultado.data) {
          toast.success(`Compra registrada correctamente. ID: ${resultado.data.compra_id}`);
        }
        return true;
      }
      toast.error(resultado.message || 'Error al registrar la compra');
      return false;
    } catch {
      toast.error('Error inesperado al registrar la compra');
      return false;
    }
  };

  const handleConfirmarSalida = () => {
    if (proveedor || productos.length > 0) {
      openModal('salidaCompra');
    } else {
      window.location.href = '/';
    }
  };

  if (!user || user.rol !== 'GERENTE') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md p-8 text-center shadow-lg">
          <CardHeader>
            <CardTitle>Acceso Restringido</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-muted-foreground">
              Solo los gerentes pueden registrar compras.
            </p>
            <Button type="button" onClick={() => router.push('/inicio')}>
              Volver al Inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30 p-4">
      <Head>
        <title>VERTIMAR | Registrar Compra</title>
        <meta
          name="description"
          content="Registro de compras a proveedores con integración de cuentas de fondos"
        />
      </Head>

      <Card className="mx-auto w-full max-w-6xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">REGISTRAR COMPRA</CardTitle>
          <CardDescription>
            Ingrese los datos de la compra a proveedor y seleccione cuenta de origen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-8 flex flex-col gap-6 md:flex-row">
            <PanelCard title="Proveedor" className="flex-1">
              <SelectorProveedores />
            </PanelCard>
            <PanelCard title="Productos" className="flex-1">
              <SelectorProductosCompra />
            </PanelCard>
          </div>

          <PanelCard title="Carrito de compra">
            <ProductosCarritoCompra />
          </PanelCard>

          {proveedor && productos.length > 0 && (
            <div className="mt-4 rounded-lg border bg-muted/30 p-3">
              <div className="flex flex-col justify-between gap-2 text-sm sm:flex-row sm:items-center">
                <div className="flex flex-wrap gap-4">
                  <span className="font-medium">Proveedor: {proveedor.nombre}</span>
                  <span>Productos: {productos.length}</span>
                </div>
                <span className="text-lg font-bold text-emerald-600">
                  Total: ${total.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <BotonAccionesCompra
            onConfirmarCompra={handleConfirmarCompra}
            onVolverMenu={handleConfirmarSalida}
            loading={loading}
            disabled={!proveedor || productos.length === 0}
          />
        </CardContent>
      </Card>

      {modales.confirmacionCompra && (
        <ModalConfirmacionCompraCompleto
          mostrar
          proveedor={proveedor}
          productos={productos}
          totalInicial={total}
          onConfirmarCompra={handleRegistrarCompra}
          onClose={() => closeModal('confirmacionCompra')}
          loading={loading}
        />
      )}

      <ConfirmModal
        open={modales.salidaCompra}
        onOpenChange={(open) => !open && closeModal('salidaCompra')}
        title="¿Estás seguro que deseas salir?"
        description="Se perderán los datos no guardados."
        confirmLabel="Sí, Salir"
        cancelLabel="No, Cancelar"
        variant="danger"
        onConfirm={() => {
          window.location.href = '/';
        }}
      />
    </div>
  );
}

export default function RegistrarCompra() {
  return (
    <CompraProvider>
      <RegistrarCompraContent />
    </CompraProvider>
  );
}
