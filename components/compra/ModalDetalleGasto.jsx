import { FormModal } from '@/components/shared/FormModal';
import { Button } from '@/components/ui/button';

const formatCurrency = (value) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(
    parseFloat(value) || 0
  );

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function ModalDetalleGasto({ open, gasto, onClose, onGestionarComprobante }) {
  if (!gasto) return null;

  return (
    <FormModal
      open={open}
      onOpenChange={(isOpen) => !isOpen && onClose()}
      title="Detalle del Gasto"
      size="md"
      hideFooter
    >
      <div className="space-y-4">
        <div className="rounded-lg border bg-blue-50/50 p-4">
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="font-medium">ID</span>
              <span>{gasto.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Fecha</span>
              <span>{formatDate(gasto.fecha)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Descripción</span>
              <span>{gasto.descripcion}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Monto</span>
              <span className="font-bold text-blue-700">{formatCurrency(gasto.monto)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Forma de Pago</span>
              <span>{gasto.forma_pago}</span>
            </div>
          </div>

          {gasto.observaciones && (
            <div className="mt-4 border-t pt-3">
              <p className="text-sm font-medium">Observaciones</p>
              <p className="mt-1 text-sm text-muted-foreground">{gasto.observaciones}</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => onGestionarComprobante(gasto.id)}>
            Gestionar Comprobante
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </FormModal>
  );
}
