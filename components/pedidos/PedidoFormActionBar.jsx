import { Button } from '@/components/ui/button';
import { formatearMoneda } from '@/utils/formatearMoneda';
import { Loader2 } from 'lucide-react';

/**
 * Barra de acciones fija en mobile para formularios de pedido/venta.
 * En desktop se renderiza inline (md:static).
 */
export default function PedidoFormActionBar({
  totalProductos = 0,
  subtotal = 0,
  totalIva = 0,
  total = 0,
  primaryLabel = 'Confirmar Pedido',
  secondaryLabel = 'Volver al Inicio',
  onPrimary,
  onSecondary,
  loading = false,
  variant = 'default',
  showTotalsDetail = true,
  className = '',
}) {
  const isOffline = variant === 'offline';

  return (
    <>
      <div className="h-28 md:hidden" aria-hidden />

      <div
        className={`fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur md:static md:mt-6 md:rounded-lg md:border md:shadow-none ${isOffline ? 'border-amber-200 bg-amber-50/95' : ''} ${className}`}
        style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
      >
        {showTotalsDetail && (
          <div className="mb-3 space-y-0.5 text-sm font-medium md:text-base">
            <p>
              Productos: <span className="text-primary">{totalProductos}</span>
            </p>
            <p className="hidden sm:block text-muted-foreground">
              Subtotal sin IVA: {formatearMoneda(subtotal)} · IVA: {formatearMoneda(totalIva)}
            </p>
            <p className="text-base font-semibold md:text-lg">
              Total:{' '}
              <span className={isOffline ? 'text-amber-700' : 'text-emerald-600'}>
                {formatearMoneda(total)}
              </span>
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            onClick={onPrimary}
            disabled={loading}
            className={`min-h-[44px] w-full sm:w-auto ${isOffline ? 'bg-amber-600 hover:bg-amber-700' : ''}`}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" />
                {isOffline ? 'Guardando offline...' : 'Procesando...'}
              </>
            ) : (
              primaryLabel
            )}
          </Button>
          {onSecondary && (
            <Button
              variant="danger"
              onClick={onSecondary}
              disabled={loading}
              className="min-h-[44px] w-full sm:w-auto"
            >
              {secondaryLabel}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
