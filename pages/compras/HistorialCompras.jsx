import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useQueryClient } from '@tanstack/react-query';
import toast from '@/components/shared/toast';
import useAuth from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CompraProvider, useComprasHistorialUI } from '@/context/ComprasContext';
import { useHistorialCompras } from '@/hooks/compra/useHistorialCompras';
import { useDetalleCompra, useDetalleGasto } from '@/hooks/compra/useDetalleCompra';
import { useComprobantes } from '@/hooks/useComprobantes';
import { useAnularCompraMutation } from '@/hooks/queries/finanzasQueries';
import { useInvalidateFinanzas } from '@/hooks/queries/useInvalidateQueries';
import TabsHistorialCompras from '@/components/compra/TabsHistorialCompras';
import TablaComprasHistorial from '@/components/compra/TablaComprasHistorial';
import TablaGastosHistorial from '@/components/compra/TablaGastosHistorial';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { RefreshCw } from 'lucide-react';

const ModalDetalleCompra = dynamic(() => import('@/components/compra/ModalDetalleCompra'), {
  ssr: false,
});
const ModalDetalleGasto = dynamic(() => import('@/components/compra/ModalDetalleGasto'), {
  ssr: false,
});
const ModalComprobanteCompra = dynamic(
  () => import('@/components/compra/ModalComprobanteCompra'),
  { ssr: false }
);

function HistorialComprasContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [anulando, setAnulando] = useState(false);
  const anularMutation = useAnularCompraMutation();
  const { invalidateCompras, invalidateFondos } = useInvalidateFinanzas();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user && user.rol !== 'GERENTE') {
      router.push('/inicio');
    }
  }, [user, router]);

  const {
    vistaActiva,
    setVistaActiva,
    seleccion,
    toggleSeleccionCompra,
    toggleSeleccionGasto,
    setSeleccionCompras,
    setSeleccionGastos,
    modales,
    openModal,
    closeModal,
    comprobante,
    setComprobante,
    clearComprobante,
  } = useComprasHistorialUI();

  const {
    compras,
    gastos,
    totalCompras,
    totalGastos,
    comprasFiltradas,
    gastosFiltrados,
    filtros,
    paginacionCompras,
    paginacionGastos,
    totalPaginasCompras,
    totalPaginasGastos,
    indexOfPrimeroCompras,
    indexOfUltimoCompras,
    indexOfPrimeroGastos,
    indexOfUltimoGastos,
    loadingCompras,
    loadingGastos,
    cargarDatos,
    handleFiltroChange,
    cambiarPaginaCompras,
    cambiarPaginaGastos,
    cambiarRegistrosPorPaginaCompras,
    cambiarRegistrosPorPaginaGastos,
  } = useHistorialCompras();

  const {
    compra,
    productos,
    loadingProductos,
    verDetalleCompra,
    cerrarDetalleCompra,
  } = useDetalleCompra();

  const { gasto, verDetalleGasto, cerrarDetalleGasto } = useDetalleGasto();

  const {
    comprobante: archivoComprobante,
    comprobanteExistente,
    uploadingComprobante,
    verificarComprobante,
    subirComprobante,
    verComprobante,
    eliminarComprobante,
    handleFileChange,
    limpiarEstados,
    getArchivoInfo,
  } = useComprobantes();

  const handleOpenComprobante = async (id, tipo) => {
    setComprobante(tipo, id);
    limpiarEstados();
    await verificarComprobante(id, tipo);
    openModal('comprobante');
  };

  const handleUploadComprobante = async () => {
    const success = await subirComprobante(comprobante.id, comprobante.tipo);
    if (success) {
      setTimeout(() => closeModal('comprobante'), 1500);
    }
  };

  const handleViewComprobante = async () => {
    if (!comprobante.id || !comprobante.tipo) {
      toast.error('No se ha seleccionado un comprobante válido');
      return;
    }
    await verComprobante(comprobante.id, comprobante.tipo);
  };

  const handleEliminarComprobante = async () => {
    const success = await eliminarComprobante(comprobante.id, comprobante.tipo);
    if (success) {
      closeModal('comprobante');
    }
  };

  const handleCloseComprobante = () => {
    closeModal('comprobante');
    clearComprobante();
    limpiarEstados();
  };

  const handleAnularCompra = async (compraId) => {
    setAnulando(true);
    try {
      await anularMutation.mutateAsync(compraId);
      toast.success('Compra anulada correctamente');
      cerrarDetalleCompra();
      invalidateCompras();
      invalidateFondos();
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      await cargarDatos();
    } catch (error) {
      toast.error(error.message || 'No se pudo anular la compra');
    } finally {
      setAnulando(false);
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
              Solo los gerentes pueden acceder al historial de compras.
            </p>
            <Button type="button" onClick={() => router.push('/inicio')}>
              Volver al Inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSelectAllCompras = (checked) => {
    setSeleccionCompras(checked ? compras.map((c) => c.id) : []);
  };

  const handleSelectAllGastos = (checked) => {
    setSeleccionGastos(checked ? gastos.map((g) => g.id) : []);
  };

  const confirmarSalida = () => {
    openModal('salida');
  };

  const showCompras = vistaActiva === 'compras' || vistaActiva === 'todos';
  const showGastos = vistaActiva === 'gastos' || vistaActiva === 'todos';

  return (
    <div className="flex min-h-screen flex-col bg-muted/30 p-4">
      <Head>
        <title>VERTIMAR | HISTORIAL DE COMPRAS Y GASTOS</title>
        <meta
          name="description"
          content="Historial de compras y gastos en el sistema VERTIMAR"
        />
      </Head>

      <Card className="mx-auto w-full max-w-6xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">HISTORIAL DE COMPRAS Y GASTOS</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Input
              placeholder="Buscar..."
              value={filtros.busqueda}
              onChange={(e) => handleFiltroChange('busqueda', e.target.value)}
              className="max-w-sm"
            />
            <Button type="button" variant="outline" onClick={cargarDatos}>
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </Button>
          </div>

          <TabsHistorialCompras
            vistaActiva={vistaActiva}
            onChange={setVistaActiva}
            totalCompras={comprasFiltradas.length}
            totalGastos={gastosFiltrados.length}
          />

          {showCompras && (
            <TablaComprasHistorial
              compras={compras}
              totalCompras={totalCompras}
              loading={loadingCompras}
              seleccion={seleccion.compras}
              onToggleSeleccion={toggleSeleccionCompra}
              onSelectAll={handleSelectAllCompras}
              onVerDetalle={verDetalleCompra}
              onComprobante={(id) => handleOpenComprobante(id, 'compra')}
              paginacion={paginacionCompras}
              totalPaginas={totalPaginasCompras}
              indexOfPrimero={indexOfPrimeroCompras}
              indexOfUltimo={indexOfUltimoCompras}
              onCambiarPagina={cambiarPaginaCompras}
              onCambiarRegistrosPorPagina={cambiarRegistrosPorPaginaCompras}
              showTitle={vistaActiva === 'todos'}
            />
          )}

          {showGastos && (
            <TablaGastosHistorial
              gastos={gastos}
              totalGastos={totalGastos}
              loading={loadingGastos}
              seleccion={seleccion.gastos}
              onToggleSeleccion={toggleSeleccionGasto}
              onSelectAll={handleSelectAllGastos}
              onVerDetalle={verDetalleGasto}
              onComprobante={(id) => handleOpenComprobante(id, 'gasto')}
              paginacion={paginacionGastos}
              totalPaginas={totalPaginasGastos}
              indexOfPrimero={indexOfPrimeroGastos}
              indexOfUltimo={indexOfUltimoGastos}
              onCambiarPagina={cambiarPaginaGastos}
              onCambiarRegistrosPorPagina={cambiarRegistrosPorPaginaGastos}
              showTitle={vistaActiva === 'todos'}
            />
          )}

          <div className="mt-6 flex justify-end">
            <Button type="button" variant="danger" onClick={confirmarSalida}>
              Volver al Menú
            </Button>
          </div>
        </CardContent>
      </Card>

      {modales.detalleCompra && (
        <ModalDetalleCompra
          open
          compra={compra}
          productos={productos}
          loadingProductos={loadingProductos}
          onClose={cerrarDetalleCompra}
          onAnular={handleAnularCompra}
          anulando={anulando}
          onGestionarComprobante={(id) => {
            cerrarDetalleCompra();
            handleOpenComprobante(id, 'compra');
          }}
        />
      )}

      {modales.detalleGasto && (
        <ModalDetalleGasto
          open
          gasto={gasto}
          onClose={cerrarDetalleGasto}
          onGestionarComprobante={(id) => {
            cerrarDetalleGasto();
            handleOpenComprobante(id, 'gasto');
          }}
        />
      )}

      {modales.comprobante && (
        <ModalComprobanteCompra
          open
          tipo={comprobante.tipo}
          id={comprobante.id}
          comprobanteExistente={comprobanteExistente}
          comprobante={archivoComprobante}
          uploadingComprobante={uploadingComprobante}
          getArchivoInfo={getArchivoInfo}
          onClose={handleCloseComprobante}
          onFileChange={handleFileChange}
          onUpload={handleUploadComprobante}
          onView={handleViewComprobante}
          onDelete={handleEliminarComprobante}
        />
      )}

      <ConfirmModal
        open={modales.salida}
        onOpenChange={(open) => !open && closeModal('salida')}
        title="¿Estás seguro que deseas salir?"
        description="Se perderán los cambios no guardados."
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

export default function HistorialCompras() {
  return (
    <CompraProvider>
      <HistorialComprasContent />
    </CompraProvider>
  );
}
