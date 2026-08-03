import { Button } from '@/components/ui/button';

export function BotonAccionesCompra({
  onConfirmarCompra,
  onVolverMenu,
  loading = false,
  disabled = false,
}) {
  return (
    <div className="mt-6 flex flex-col justify-end gap-4 sm:flex-row">
      <Button
        type="button"
        onClick={onConfirmarCompra}
        disabled={loading || disabled}
      >
        {loading ? 'Procesando...' : 'Confirmar Compra'}
      </Button>
      <Button type="button" variant="danger" onClick={onVolverMenu} disabled={loading}>
        Volver al Menú
      </Button>
    </div>
  );
}
