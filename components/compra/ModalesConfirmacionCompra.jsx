import { ConfirmModal } from '@/components/shared/ConfirmModal';

const formatCurrency = (value) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);

export function ModalConfirmacionSalidaCompra({ mostrar, onConfirmar, onCancelar }) {
  return (
    <ConfirmModal
      open={mostrar}
      onOpenChange={(open) => !open && onCancelar()}
      title="¿Estás seguro que deseas salir?"
      description="Se perderán los datos no guardados."
      confirmLabel="Sí, Salir"
      cancelLabel="No, Cancelar"
      variant="danger"
      onConfirm={onConfirmar}
    />
  );
}

export function ModalConfirmacionCompra({
  mostrar,
  proveedor,
  total,
  onConfirmar,
  onCancelar,
  loading = false,
}) {
  return (
    <ConfirmModal
      open={mostrar}
      onOpenChange={(open) => !open && onCancelar()}
      title="Confirmar Compra"
      description={`¿Desea confirmar la compra al proveedor ${proveedor?.nombre} por un total de ${formatCurrency(total)}?`}
      confirmLabel={loading ? 'Procesando...' : 'Sí, Confirmar'}
      cancelLabel="No, Cancelar"
      loading={loading}
      onConfirm={onConfirmar}
    />
  );
}

export { ModalConfirmacionCompraCompleto } from './ModalConfirmacionCompraCompleto';
