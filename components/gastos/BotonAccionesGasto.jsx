import { Button } from '@/components/ui/button';

export function BotonAccionesGasto({
  onRegistrarGasto,
  onLimpiarFormulario,
  onVolverMenu,
  loading,
  disabled,
}) {
  return (
    <div className="border-t bg-muted/20 p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row">
        <Button
          type="button"
          variant="secondary"
          onClick={onVolverMenu}
          disabled={loading}
          className="order-3 sm:order-1"
        >
          Volver al Menú
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onLimpiarFormulario}
          disabled={loading}
          className="order-2"
        >
          Limpiar Formulario
        </Button>

        <Button
          type="button"
          onClick={onRegistrarGasto}
          disabled={disabled || loading}
          className="order-1 sm:order-3"
        >
          {loading ? 'Procesando...' : 'Registrar Gasto'}
        </Button>
      </div>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        {disabled ? (
          <span className="font-medium text-amber-600">
            Complete todos los campos obligatorios para continuar
          </span>
        ) : (
          <span className="text-emerald-600">Formulario válido — puede proceder con el registro</span>
        )}
      </p>
    </div>
  );
}
