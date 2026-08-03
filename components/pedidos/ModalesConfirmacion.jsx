import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { Z_INDEX } from '@/constants/zIndex';
import { formatearMoneda } from '@/utils/formatearMoneda';

export function ModalConfirmacionPedido({
  mostrar,
  cliente,
  totalProductos,
  subtotal = 0,
  totalIva = 0,
  total,
  onConfirmar,
  onCancelar,
  loading = false,
}) {
  return (
    <ConfirmModal
      open={mostrar}
      onOpenChange={(open) => !open && !loading && onCancelar?.()}
      title="Confirmar Pedido"
      confirmLabel="Sí, Confirmar"
      cancelLabel="No, Cancelar"
      variant="primary"
      loading={loading}
      onConfirm={onConfirmar}
    >
      <div className="space-y-4 text-center text-sm">
        <p>
          ¿Deseas confirmar el pedido para el cliente{' '}
          <span className="font-bold">{cliente?.nombre}</span> con{' '}
          <span className="font-bold">{totalProductos}</span> productos y un total de{' '}
          <span className="font-bold text-emerald-700">{formatearMoneda(total)}</span>?
        </p>
        <div className="rounded-lg border bg-muted/30 p-3 text-left">
          <p className="text-muted-foreground">Resumen del monto informado al cliente</p>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between">
              <span>Subtotal sin IVA</span>
              <span className="font-medium">{formatearMoneda(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>IVA total</span>
              <span className="font-medium">{formatearMoneda(totalIva)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t pt-2 text-base">
              <span className="font-semibold">Total final a cobrar</span>
              <span className="font-bold text-emerald-700">{formatearMoneda(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </ConfirmModal>
  );
}

export function ModalConfirmacionSalidaPedidos({ mostrar, onConfirmar, onCancelar }) {
  return (
    <ConfirmModal
      open={mostrar}
      onOpenChange={(open) => !open && onCancelar?.()}
      title="¿Estás seguro que deseas salir?"
      description="Se cerrará el historial de pedidos."
      confirmLabel="Sí, Salir"
      cancelLabel="No, Cancelar"
      variant="danger"
      onConfirm={onConfirmar}
    />
  );
}

export function ModalConfirmacionCambioEstado({
  mostrar,
  pedidosSeleccionados,
  nuevoEstado,
  onConfirmar,
  onCancelar,
  loading = false,
}) {
  return (
    <ConfirmModal
      open={mostrar}
      onOpenChange={(open) => !open && !loading && onCancelar?.()}
      title="Confirmar Cambio de Estado"
      description={`¿Deseas cambiar el estado de ${pedidosSeleccionados} pedido(s) a ${nuevoEstado}? Esta acción se aplicará a todos los pedidos seleccionados.`}
      confirmLabel="Sí, Cambiar"
      cancelLabel="No, Cancelar"
      variant="primary"
      loading={loading}
      onConfirm={onConfirmar}
    />
  );
}

export function ModalConfirmacionEliminarMultiple({
  mostrar,
  pedidosSeleccionados,
  onConfirmar,
  onCancelar,
  loading = false,
}) {
  return (
    <ConfirmModal
      open={mostrar}
      onOpenChange={(open) => !open && !loading && onCancelar?.()}
      title="Confirmar Eliminación"
      description={`¿Estás seguro de eliminar ${pedidosSeleccionados} pedido(s)? Esta acción es IRREVERSIBLE y eliminará los pedidos y todos sus productos.`}
      confirmLabel="Sí, Eliminar"
      cancelLabel="No, Cancelar"
      variant="danger"
      loading={loading}
      onConfirm={onConfirmar}
    />
  );
}

export function ModalConfirmacionAnularPedidoIndividual({
  mostrar,
  pedido,
  productos = [],
  onConfirmar,
  onCancelar,
  loading = false,
}) {
  if (!pedido) return null;

  const totalProductos = productos.reduce((acc, prod) => acc + (Number(prod.cantidad) || 0), 0);
  const subtotal = productos.reduce((acc, prod) => acc + (Number(prod.subtotal) || 0), 0);
  const ivaTotal = productos.reduce((acc, prod) => acc + (Number(prod.iva) || 0), 0);
  const total = subtotal + ivaTotal;

  return (
    <ConfirmModal
      open={mostrar}
      onOpenChange={(open) => !open && !loading && onCancelar?.()}
      title="Confirmar Anulación de Pedido"
      confirmLabel="Sí, Anular Pedido"
      cancelLabel="No, Cancelar"
      variant="danger"
      loading={loading}
      onConfirm={onConfirmar}
      zIndex={Z_INDEX.MODAL_NESTED}
    >
      <div className="space-y-3 text-sm">
        <p className="text-center font-semibold">
          ¿Estás seguro que deseas anular el pedido #{pedido.id}?
        </p>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <h4 className="mb-2 font-semibold text-amber-800">Detalles del pedido</h4>
          <div className="space-y-1 text-amber-700">
            <p>
              <strong>Cliente:</strong> {pedido.cliente_nombre}
            </p>
            <p>
              <strong>Cantidad de productos:</strong> {totalProductos} unidades
            </p>
            <p>
              <strong>Total del pedido:</strong> {formatearMoneda(total)}
            </p>
            <p>
              <strong>Fecha:</strong> {pedido.fecha}
            </p>
          </div>
        </div>
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-destructive">
          <p>Se reestablecerá el stock de todos los productos del pedido.</p>
          <p>Esta acción cambiará el estado del pedido a &quot;Anulado&quot;.</p>
        </div>
      </div>
    </ConfirmModal>
  );
}
