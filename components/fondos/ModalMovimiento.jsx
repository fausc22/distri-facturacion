import { FormModal } from '@/components/shared/FormModal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const OPCIONES_ORIGEN = {
  INGRESO: [
    { value: 'ingreso manual', label: 'Ingreso Manual' },
    { value: 'venta', label: 'Venta' },
    { value: 'cobro', label: 'Cobro de Deuda' },
    { value: 'transferencia', label: 'Transferencia Recibida' },
    { value: 'otro', label: 'Otro' },
  ],
  EGRESO: [
    { value: 'gasto manual', label: 'Gasto Manual' },
    { value: 'compra', label: 'Compra' },
    { value: 'pago', label: 'Pago a Proveedor' },
    { value: 'transferencia', label: 'Transferencia Enviada' },
    { value: 'otro', label: 'Otro' },
  ],
};

const selectClass =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

export default function ModalMovimiento({
  mostrar,
  cuentas,
  formData,
  loading = false,
  onInputChange,
  onGuardar,
  onCerrar,
}) {
  const esIngreso = formData.tipo === 'INGRESO';
  const disableSubmit = !formData.cuenta_id || formData.monto <= 0;

  return (
    <FormModal
      open={mostrar}
      onOpenChange={(open) => !open && onCerrar()}
      title={esIngreso ? 'Registrar Ingreso' : 'Registrar Egreso'}
      submitLabel={esIngreso ? 'Registrar Ingreso' : 'Registrar Egreso'}
      loading={loading}
      disableSubmit={disableSubmit}
      onSubmit={onGuardar}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Cuenta *</Label>
          <select
            name="cuenta_id"
            className={selectClass}
            value={formData.cuenta_id}
            onChange={onInputChange}
            required
          >
            <option value="">Seleccionar cuenta</option>
            {cuentas.map((cuenta) => (
              <option key={cuenta.id} value={cuenta.id}>
                {cuenta.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label>Tipo de movimiento</Label>
          <div className="flex">
            <Button
              type="button"
              variant={formData.tipo === 'INGRESO' ? 'default' : 'outline'}
              className={cn(
                'flex-1 rounded-r-none',
                formData.tipo === 'INGRESO' && 'bg-emerald-600 hover:bg-emerald-700'
              )}
              onClick={() => onInputChange({ target: { name: 'tipo', value: 'INGRESO' } })}
            >
              Ingreso
            </Button>
            <Button
              type="button"
              variant={formData.tipo === 'EGRESO' ? 'default' : 'outline'}
              className={cn(
                'flex-1 rounded-l-none',
                formData.tipo === 'EGRESO' && 'bg-destructive hover:bg-destructive/90'
              )}
              onClick={() => onInputChange({ target: { name: 'tipo', value: 'EGRESO' } })}
            >
              Egreso
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Origen / concepto *</Label>
          <select
            name="origen"
            className={selectClass}
            value={formData.origen}
            onChange={onInputChange}
            required
          >
            {OPCIONES_ORIGEN[formData.tipo].map((opcion) => (
              <option key={opcion.value} value={opcion.value}>
                {opcion.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label>Monto *</Label>
          <div className="flex">
            <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm">
              $
            </span>
            <Input
              type="number"
              name="monto"
              step="0.01"
              min="0.01"
              className="rounded-l-none"
              value={formData.monto}
              onChange={onInputChange}
              placeholder="0.00"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Descripción (opcional)</Label>
          <textarea
            name="descripcion"
            className={cn(selectClass, 'min-h-[72px] py-2')}
            rows={2}
            value={formData.descripcion}
            onChange={onInputChange}
            placeholder="Añadir una descripción..."
          />
        </div>
      </div>
    </FormModal>
  );
}
