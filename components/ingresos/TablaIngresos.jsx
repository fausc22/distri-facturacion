import { useMemo } from 'react';
import { MdRemoveRedEye } from 'react-icons/md';
import { DataTable } from '@/components/tables/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/shared/StateViews';

const formatCurrency = (value) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);

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

const obtenerIdParaDetalle = (ingreso) =>
  ingreso.tipo === 'Venta' ? ingreso.referencia : ingreso.id;

function ResumenIngresos({ totalIngresos }) {
  return (
    <div className="bg-primary p-4 text-primary-foreground">
      <div className="flex flex-col justify-between md:flex-row">
        <h2 className="text-xl font-semibold">Resumen de Ingresos</h2>
        <div className="mt-2 md:mt-0">
          <span className="mr-2">Total:</span>
          <span className="text-lg font-bold">{formatCurrency(totalIngresos)}</span>
        </div>
      </div>
    </div>
  );
}

function TarjetasMoviles({ ingresos, onVerDetalle }) {
  return (
    <div className="md:hidden">
      {ingresos.length > 0 ? (
        <div className="divide-y">
          {ingresos.map((ingreso, index) => (
            <div key={index} className="p-4 hover:bg-muted/30">
              <div className="mb-2 flex items-start justify-between">
                <Badge variant={ingreso.tipo === 'Venta' ? 'success' : 'info'}>
                  {ingreso.tipo}
                </Badge>
                <span className="font-semibold text-emerald-600">
                  {formatCurrency(ingreso.monto)}
                </span>
              </div>
              <div className="mb-2 space-y-1">
                <p className="text-sm text-muted-foreground">{formatDate(ingreso.fecha)}</p>
                <p className="font-medium">{ingreso.descripcion || ingreso.origen || '-'}</p>
                <p className="text-sm">Cuenta: {ingreso.cuenta || '-'}</p>
                {ingreso.referencia && <p className="text-sm">Ref: {ingreso.referencia}</p>}
              </div>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onVerDetalle(obtenerIdParaDetalle(ingreso), ingreso.tipo)}
                >
                  <MdRemoveRedEye size={18} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 text-center text-muted-foreground">No hay ingresos registrados</div>
      )}
    </div>
  );
}

export default function TablaIngresos({
  ingresos,
  totalIngresos,
  loading = false,
  onVerDetalle,
}) {
  const columns = useMemo(
    () => [
      {
        accessorKey: 'fecha',
        header: 'Fecha',
        cell: ({ row }) => formatDate(row.original.fecha),
      },
      {
        accessorKey: 'tipo',
        header: 'Tipo',
        cell: ({ row }) => (
          <Badge variant={row.original.tipo === 'Venta' ? 'success' : 'info'}>
            {row.original.tipo}
          </Badge>
        ),
      },
      {
        accessorKey: 'referencia',
        header: 'Referencia',
        cell: ({ row }) => row.original.referencia || '-',
      },
      {
        id: 'descripcion',
        header: 'Descripción/Origen',
        cell: ({ row }) => row.original.descripcion || row.original.origen || '-',
      },
      {
        accessorKey: 'cuenta',
        header: 'Cuenta',
        cell: ({ row }) => row.original.cuenta || '-',
      },
      {
        accessorKey: 'monto',
        header: 'Monto',
        cell: ({ row }) => (
          <span className="font-semibold text-emerald-600">
            {formatCurrency(row.original.monto)}
          </span>
        ),
      },
      {
        id: 'acciones',
        header: 'Acciones',
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              onVerDetalle(obtenerIdParaDetalle(row.original), row.original.tipo)
            }
          >
            <MdRemoveRedEye size={18} />
          </Button>
        ),
      },
    ],
    [onVerDetalle]
  );

  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <ResumenIngresos totalIngresos={totalIngresos} />

      {loading ? (
        <LoadingState message="Cargando ingresos..." />
      ) : (
        <>
          <div className="hidden p-4 md:block">
            <DataTable
              columns={columns}
              data={ingresos}
              enablePagination={false}
              emptyMessage="No hay ingresos registrados"
            />
          </div>
          <TarjetasMoviles ingresos={ingresos} onVerDetalle={onVerDetalle} />
        </>
      )}
    </div>
  );
}
