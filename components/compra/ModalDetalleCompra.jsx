import { MdRemoveRedEye } from 'react-icons/md';
import { FormModal } from '@/components/shared/FormModal';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/shared/StateViews';
import { DataTable } from '@/components/tables/DataTable';
import { formatearCantidad } from '@/utils/formatearCantidad';

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

export default function ModalDetalleCompra({
  open,
  compra,
  productos,
  loadingProductos,
  onClose,
  onGestionarComprobante,
}) {
  if (!compra) return null;

  const columns = [
    { accessorKey: 'producto_id', header: 'Código' },
    { accessorKey: 'producto_nombre', header: 'Nombre' },
    { accessorKey: 'producto_um', header: 'UM' },
    {
      accessorKey: 'cantidad',
      header: 'Cantidad',
      cell: ({ row }) => formatearCantidad(row.original.cantidad),
    },
    {
      accessorKey: 'precio_costo',
      header: 'Precio Costo',
      cell: ({ row }) => formatCurrency(row.original.precio_costo),
    },
    {
      accessorKey: 'precio_venta',
      header: 'Precio Venta',
      cell: ({ row }) => formatCurrency(row.original.precio_venta),
    },
    {
      accessorKey: 'subtotal',
      header: 'Subtotal',
      cell: ({ row }) => formatCurrency(row.original.subtotal),
    },
  ];

  return (
    <FormModal
      open={open}
      onOpenChange={(isOpen) => !isOpen && onClose()}
      title="Detalle de Compra"
      size="xl"
      hideFooter
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          <strong>Fecha:</strong> {formatDate(compra.fecha)}
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border p-4">
            <h3 className="mb-2 font-semibold">Información del Proveedor</h3>
            <p className="text-sm">
              <strong>Proveedor:</strong> {compra.proveedor_nombre}
            </p>
            <p className="text-sm">
              <strong>CUIT:</strong> {compra.proveedor_cuit}
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="mb-2 font-semibold">Información de la Compra</h3>
            <p className="text-sm">
              <strong>Estado:</strong> {compra.estado}
            </p>
            <p className="text-sm">
              <strong>Total:</strong> {formatCurrency(compra.total)}
            </p>
          </div>
        </div>

        <div>
          <h3 className="mb-2 font-semibold">Productos Comprados</h3>
          {loadingProductos ? (
            <LoadingState message="Cargando productos..." />
          ) : (
            <DataTable columns={columns} data={productos} enablePagination={false} />
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => onGestionarComprobante(compra.id)}>
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
