import { FormModal } from '@/components/shared/FormModal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ModalCuenta({
  mostrar,
  formData,
  loading = false,
  onInputChange,
  onGuardar,
  onCerrar,
}) {
  return (
    <FormModal
      open={mostrar}
      onOpenChange={(open) => !open && onCerrar()}
      title="Nueva Cuenta"
      submitLabel="Guardar"
      loading={loading}
      onSubmit={onGuardar}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Nombre de la cuenta *</Label>
          <Input
            name="nombre"
            value={formData.nombre}
            onChange={onInputChange}
            placeholder="Ej: Caja, Banco, Mercado Pago..."
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Saldo inicial</Label>
          <Input
            type="number"
            name="saldo"
            step="0.01"
            value={formData.saldo}
            onChange={onInputChange}
            placeholder="0.00"
          />
        </div>
      </div>
    </FormModal>
  );
}
