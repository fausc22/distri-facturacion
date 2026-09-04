import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import toast from '@/components/shared/toast';
import useAuth from '../../hooks/useAuth';
import { FondosProvider, useFondos } from '../../context/FondosContext';
import { useCuentas } from '../../hooks/fondos/useCuentas';
import { useMovimientos } from '../../hooks/fondos/useMovimientos';
import { useTransferencias } from '../../hooks/fondos/useTransferencias';
import TablaCuentas from '../../components/fondos/TablaCuentas';
import TablaMovimientos from '../../components/fondos/TablaMovimientos';
import FiltrosMovimientos from '../../components/fondos/FiltrosMovimientos';
import AccionesRapidas from '../../components/fondos/AccionesRapidas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RefreshCw, Plus } from 'lucide-react';

const ModalCuenta = dynamic(() => import('../../components/fondos/ModalCuenta'), { ssr: false });
const ModalMovimiento = dynamic(() => import('../../components/fondos/ModalMovimiento'), { ssr: false });
const ModalTransferencia = dynamic(() => import('../../components/fondos/ModalTransferencia'), { ssr: false });

function FondosContent() {
  const { user } = useAuth();
  const router = useRouter();
  const { vistaActiva, loading, modales, setVistaActiva, setModal } = useFondos();

  const {
    cuentas,
    formData: formDataCuenta,
    totalSaldos,
    loading: loadingCuentas,
    cargarCuentas,
    crearCuenta,
    handleInputChange: handleCuentaChange,
    resetForm: resetCuentaForm,
  } = useCuentas();

  const {
    movimientos,
    formData: formDataMovimiento,
    filtros,
    loading: loadingMovimientos,
    registrarMovimiento,
    handleInputChange: handleMovimientoChange,
    handleFiltroChange,
    aplicarFiltros,
    limpiarFiltros,
    resetForm: resetMovimientoForm,
    precargarFormulario,
  } = useMovimientos();

  const {
    formData: formDataTransferencia,
    realizarTransferencia,
    handleInputChange: handleTransferenciaChange,
    resetForm: resetTransferenciaForm,
    precargarCuentaOrigen,
  } = useTransferencias();

  useEffect(() => {
    if (user && user.rol !== 'GERENTE') {
      router.push('/inicio');
    }
  }, [user, router]);

  const handleOpenModal = (modal) => setModal(modal, true);
  const handleCloseModal = (modal) => {
    setModal(modal, false);
    if (modal === 'cuenta') resetCuentaForm();
    if (modal === 'movimiento') resetMovimientoForm();
    if (modal === 'transferencia') resetTransferenciaForm();
  };

  const handleIngreso = (cuentaId = '') => {
    cuentaId ? precargarFormulario(cuentaId, 'INGRESO') : resetMovimientoForm();
    handleOpenModal('movimiento');
  };

  const handleEgreso = (cuentaId = '') => {
    if (cuentaId) precargarFormulario(cuentaId, 'EGRESO');
    else {
      resetMovimientoForm();
      handleMovimientoChange({ target: { name: 'tipo', value: 'EGRESO' } });
    }
    handleOpenModal('movimiento');
  };

  const handleTransferencia = (cuentaId = '') => {
    cuentaId ? precargarCuentaOrigen(cuentaId) : resetTransferenciaForm();
    handleOpenModal('transferencia');
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
              Solo los gerentes pueden acceder a la gestión de fondos.
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
        <title>VERTIMAR | TESORERÍA</title>
        <meta name="description" content="Gestión de tesorería en el sistema VERTIMAR" />
      </Head>

      <Card className="mx-auto w-full max-w-6xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">GESTIÓN DE FONDOS</CardTitle>
        </CardHeader>
        <CardContent>
          <nav className="mb-6 flex border-b">
            {[
              { id: 'cuentas', label: 'Cuentas y Saldos' },
              { id: 'movimientos', label: 'Historial de Movimientos' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setVistaActiva(tab.id)}
                className={cn(
                  'px-4 py-2 text-sm font-medium transition-colors',
                  vistaActiva === tab.id
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {vistaActiva === 'cuentas' && (
            <div className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-semibold">Cuentas Disponibles</h2>
                <div className="flex gap-2">
                  <Button onClick={() => handleOpenModal('cuenta')}>
                    <Plus className="h-4 w-4" /> Nueva Cuenta
                  </Button>
                  <Button variant="outline" onClick={cargarCuentas}>
                    <RefreshCw className="h-4 w-4" /> Actualizar
                  </Button>
                </div>
              </div>
              <TablaCuentas
                cuentas={cuentas}
                totalSaldos={totalSaldos}
                loading={loadingCuentas}
                onIngreso={handleIngreso}
                onEgreso={handleEgreso}
                onTransferencia={handleTransferencia}
                onVerDetalle={() => toast.info('Funcionalidad de detalle de cuenta pendiente')}
              />
              <AccionesRapidas
                onIngreso={() => handleIngreso()}
                onEgreso={() => handleEgreso()}
                onTransferencia={() => handleTransferencia()}
              />
            </div>
          )}

          {vistaActiva === 'movimientos' && (
            <div className="space-y-4">
              <FiltrosMovimientos
                cuentas={cuentas}
                filtros={filtros}
                onFiltroChange={handleFiltroChange}
                onAplicarFiltros={aplicarFiltros}
                onLimpiarFiltros={limpiarFiltros}
              />
              <TablaMovimientos
                movimientos={movimientos}
                cuentas={cuentas}
                loading={loadingMovimientos}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {modales.cuenta && (
        <ModalCuenta
          mostrar
          formData={formDataCuenta}
          loading={loading.operacion}
          onInputChange={handleCuentaChange}
          onGuardar={async () => {
            if (await crearCuenta()) handleCloseModal('cuenta');
          }}
          onCerrar={() => handleCloseModal('cuenta')}
        />
      )}
      {modales.movimiento && (
        <ModalMovimiento
          mostrar
          cuentas={cuentas}
          formData={formDataMovimiento}
          loading={loading.operacion}
          onInputChange={handleMovimientoChange}
          onGuardar={async () => {
            if (await registrarMovimiento()) handleCloseModal('movimiento');
          }}
          onCerrar={() => handleCloseModal('movimiento')}
        />
      )}
      {modales.transferencia && (
        <ModalTransferencia
          mostrar
          cuentas={cuentas}
          formData={formDataTransferencia}
          loading={loading.operacion}
          onInputChange={handleTransferenciaChange}
          onGuardar={async () => {
            if (await realizarTransferencia()) handleCloseModal('transferencia');
          }}
          onCerrar={() => handleCloseModal('transferencia')}
        />
      )}
    </div>
  );
}

export default function Fondos() {
  return (
    <FondosProvider>
      <FondosContent />
    </FondosProvider>
  );
}
