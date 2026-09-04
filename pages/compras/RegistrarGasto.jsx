import Head from 'next/head';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import toast from '@/components/shared/toast';
import useAuth from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PanelCard } from '@/components/shared/PanelCard';
import { GastoProvider, useGasto } from '@/context/GastosContext';
import { useRegistrarGasto } from '@/hooks/gastos/useRegistrarGasto';
import { useFormularioGasto } from '@/hooks/gastos/useFormularioGasto';
import FormularioGasto from '@/components/gastos/FormularioGasto';
import SelectorArchivosGasto from '@/components/gastos/SelectorArchivosGasto';
import { ModalConfirmacionGasto } from '@/components/gastos/ModalesConfirmacionGasto';
import { BotonAccionesGasto } from '@/components/gastos/BotonAccionesGasto';
import { ConfirmModal } from '@/components/shared/ConfirmModal';

function RegistrarGastoContent() {
  const { user } = useAuth();
  const router = useRouter();
  const {
    formData,
    resetForm,
    obtenerArchivo,
    hayArchivo,
    hasUnsavedData,
    getArchivoInfo,
    modales,
    openModal,
    closeModal,
  } = useGasto();

  const { registrarGasto, loading } = useRegistrarGasto();
  const { esFormularioValido, obtenerResumen, validarRangoMonto } = useFormularioGasto();

  useEffect(() => {
    if (user && user.rol !== 'GERENTE') {
      router.push('/inicio');
    }
  }, [user, router]);

  const handleConfirmarGasto = () => {
    if (!esFormularioValido()) {
      toast.error(
        'Por favor complete los campos obligatorios: Descripción, Monto, Forma de Pago y Cuenta'
      );
      return;
    }
    const validacionMonto = validarRangoMonto();
    if (!validacionMonto.valido) {
      toast.error(validacionMonto.mensaje);
      return;
    }
    openModal('confirmacion');
  };

  const handleRegistrarGasto = async () => {
    try {
      const archivo = obtenerArchivo();
      const exito = await registrarGasto(formData, archivo);
      if (exito) {
        resetForm();
        closeModal('confirmacion');
      }
    } catch {
      toast.error('Error inesperado al registrar el gasto');
    }
  };

  const handleLimpiarFormulario = () => {
    if (hasUnsavedData()) {
      openModal('limpiar');
    }
  };

  const handleConfirmarSalida = () => {
    if (hasUnsavedData()) {
      openModal('salida');
    } else {
      window.location.href = '/';
    }
  };

  const resumenGasto = obtenerResumen();
  const archivoInfo = getArchivoInfo();
  const resumenCompleto = {
    ...resumenGasto,
    tieneComprobante: hayArchivo(),
    nombreComprobante: archivoInfo?.nombre || null,
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
              Solo los gerentes pueden registrar gastos.
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
        <title>VERTIMAR | Registrar Gasto</title>
        <meta name="description" content="Registro de gastos VERTIMAR" />
      </Head>

      <Card className="mx-auto w-full max-w-4xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">REGISTRAR GASTO</CardTitle>
          <CardDescription>
            Complete el formulario para registrar un nuevo gasto. Los campos marcados con * son
            obligatorios.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <PanelCard title="Datos del gasto" className="border-0 shadow-none">
            <FormularioGasto />
          </PanelCard>

          <PanelCard title="Comprobante (opcional)" className="border-0 shadow-none">
            <SelectorArchivosGasto />
          </PanelCard>

          <BotonAccionesGasto
            onRegistrarGasto={handleConfirmarGasto}
            onLimpiarFormulario={handleLimpiarFormulario}
            onVolverMenu={handleConfirmarSalida}
            loading={loading}
            disabled={!esFormularioValido()}
          />
        </CardContent>
      </Card>

      {modales.confirmacion && (
        <ModalConfirmacionGasto
          mostrar
          resumen={resumenCompleto}
          onConfirmar={handleRegistrarGasto}
          onCancelar={() => closeModal('confirmacion')}
          loading={loading}
        />
      )}

      <ConfirmModal
        open={modales.salida}
        onOpenChange={(open) => !open && closeModal('salida')}
        title="¿Salir sin guardar?"
        description="Si sale ahora, se perderán todos los datos ingresados incluyendo cualquier archivo seleccionado."
        confirmLabel="Sí, Salir sin Guardar"
        cancelLabel="Continuar Editando"
        variant="danger"
        onConfirm={() => {
          window.location.href = '/';
        }}
      />

      <ConfirmModal
        open={modales.limpiar}
        onOpenChange={(open) => !open && closeModal('limpiar')}
        title="¿Limpiar formulario?"
        description="Se perderán todos los datos ingresados y el archivo seleccionado."
        confirmLabel="Sí, Limpiar"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={() => {
          resetForm();
          closeModal('limpiar');
        }}
      />
    </div>
  );
}

export default function RegistrarGasto() {
  return (
    <GastoProvider>
      <RegistrarGastoContent />
    </GastoProvider>
  );
}
