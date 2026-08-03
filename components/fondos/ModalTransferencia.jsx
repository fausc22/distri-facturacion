import { FormModal } from '@/components/shared/FormModal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const selectClass =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

export default function ModalTransferencia({
  mostrar,
  cuentas,
  formData,
  loading = false,
  onInputChange,
  onGuardar,
  onCerrar,
}) {
  const cuentasOrigen = cuentas.filter((cuenta) => cuenta.id !== formData.cuenta_destino);
  const cuentasDestino = cuentas.filter((cuenta) => cuenta.id !== formData.cuenta_origen);
  const cuentaOrigen = cuentas.find((c) => c.id === formData.cuenta_origen);
  const cuentaDestino = cuentas.find((c) => c.id === formData.cuenta_destino);

  const esTransferenciaValida =
    formData.cuenta_origen &&
    formData.cuenta_destino &&
    formData.cuenta_origen !== formData.cuenta_destino &&
    formData.monto > 0 &&
    cuentaOrigen &&
    parseFloat(cuentaOrigen.saldo) >= parseFloat(formData.monto);

  const saldoInsuficiente =
    cuentaOrigen &&
    formData.monto > 0 &&
    parseFloat(cuentaOrigen.saldo) < parseFloat(formData.monto);

  return (
    <FormModal
      open={mostrar}
      onOpenChange={(open) => !open && onCerrar()}
      title="Transferencia entre cuentas"
      submitLabel="Realizar transferencia"
      loading={loading}
      disableSubmit={!esTransferenciaValida}
      onSubmit={onGuardar}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Cuenta de origen *</Label>
          <select
            name="cuenta_origen"
            className={selectClass}
            value={formData.cuenta_origen}
            onChange={onInputChange}
            required
          >
            <option value="">Seleccionar cuenta de origen</option>
            {cuentasOrigen.map((cuenta) => (
              <option key={cuenta.id} value={cuenta.id}>
                {cuenta.nombre} - Saldo: ${parseFloat(cuenta.saldo).toFixed(2)}
              </option>
            ))}
          </select>
          {cuentaOrigen && (
            <p className="text-xs text-muted-foreground">
              Saldo disponible: ${parseFloat(cuentaOrigen.saldo).toFixed(2)}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Cuenta de destino *</Label>
          <select
            name="cuenta_destino"
            className={selectClass}
            value={formData.cuenta_destino}
            onChange={onInputChange}
            required
          >
            <option value="">Seleccionar cuenta de destino</option>
            {cuentasDestino.map((cuenta) => (
              <option key={cuenta.id} value={cuenta.id}>
                {cuenta.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label>Monto a transferir *</Label>
          <div className="flex">
            <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm">
              $
            </span>
            <Input
              type="number"
              name="monto"
              step="0.01"
              min="0.01"
              className={cn('rounded-l-none', saldoInsuficiente && 'border-destructive')}
              value={formData.monto}
              onChange={onInputChange}
              placeholder="0.00"
              required
            />
          </div>
          {saldoInsuficiente && (
            <p className="text-xs text-destructive">Saldo insuficiente en la cuenta de origen</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Descripción (opcional)</Label>
          <textarea
            name="descripcion"
            className={cn(selectClass, 'min-h-[72px] py-2')}
            rows={2}
            value={formData.descripcion}
            onChange={onInputChange}
            placeholder="Motivo de la transferencia..."
          />
        </div>

        {formData.cuenta_origen && formData.cuenta_destino && formData.monto > 0 && (
          <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-sm">
            <h4 className="mb-2 font-medium text-primary">Resumen</h4>
            <div className="space-y-1 text-muted-foreground">
              <p>
                <strong>Desde:</strong> {cuentaOrigen?.nombre}
              </p>
              <p>
                <strong>Hacia:</strong> {cuentaDestino?.nombre}
              </p>
              <p>
                <strong>Monto:</strong> ${parseFloat(formData.monto).toFixed(2)}
              </p>
              {cuentaOrigen && (
                <p>
                  <strong>Saldo restante origen:</strong> $
                  {(parseFloat(cuentaOrigen.saldo) - parseFloat(formData.monto)).toFixed(2)}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </FormModal>
  );
}
