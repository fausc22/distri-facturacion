import { FormModal } from '@/components/shared/FormModal';

export function ModalConfirmacionGasto({
  mostrar,
  resumen,
  onConfirmar,
  onCancelar,
  loading,
}) {
  if (!mostrar) return null;

  return (
    <FormModal
      open={mostrar}
      onOpenChange={(open) => !open && onCancelar()}
      title="Confirmar Registro de Gasto"
      submitLabel="Confirmar y Registrar"
      cancelLabel="Cancelar"
      loading={loading}
      onSubmit={onConfirmar}
    >
      <div className="space-y-4">
        <div className="rounded-lg border bg-blue-50/50 p-4">
          <h4 className="mb-3 font-semibold">Resumen del gasto</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <span className="font-medium text-muted-foreground">Descripción</span>
              <span>{resumen.descripcion}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="font-medium text-muted-foreground">Monto</span>
              <span className="font-bold text-blue-700">{resumen.montoFormateado}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="font-medium text-muted-foreground">Forma de Pago</span>
              <span>{resumen.formaPago}</span>
            </div>
            {resumen.observaciones && (
              <div className="border-t pt-2">
                <span className="font-medium text-muted-foreground">Observaciones</span>
                <p className="mt-1 rounded border bg-background p-2 text-xs">
                  {resumen.observaciones}
                </p>
              </div>
            )}
            {resumen.tieneComprobante && (
              <div className="border-t pt-2 text-sm text-emerald-700">
                Comprobante: {resumen.nombreComprobante}
              </div>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Una vez registrado, el gasto quedará asociado a su usuario y fecha actual.
          {resumen.tieneComprobante ? ' El comprobante se subirá automáticamente.' : ''}
        </p>
      </div>
    </FormModal>
  );
}
