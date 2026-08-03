import { useMemo } from 'react';
import { DataTable } from '@/components/tables/DataTable';
import { Badge } from '@/components/ui/badge';
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

export default function TablaMovimientos({ movimientos, cuentas, loading = false }) {
  const columns = useMemo(
    () => [
      { accessorKey: 'id', header: 'ID' },
      {
        accessorKey: 'fecha',
        header: 'Fecha',
        cell: ({ row }) => formatDate(row.original.fecha),
      },
      {
        id: 'cuenta',
        header: 'Cuenta',
        cell: ({ row }) => {
          const cuenta = cuentas.find((c) => c.id === row.original.cuenta_id);
          return cuenta?.nombre ?? 'Desconocida';
        },
      },
      {
        accessorKey: 'tipo',
        header: 'Tipo',
        cell: ({ row }) => (
          <Badge variant={row.original.tipo === 'INGRESO' ? 'success' : 'destructive'}>
            {row.original.tipo}
          </Badge>
        ),
      },
      { accessorKey: 'origen', header: 'Origen' },
      {
        accessorKey: 'monto',
        header: 'Monto',
        cell: ({ row }) => (
          <span
            className={
              row.original.tipo === 'INGRESO' ? 'font-semibold text-emerald-600' : 'font-semibold text-red-600'
            }
          >
            {formatCurrency(row.original.monto)}
          </span>
        ),
      },
    ],
    [cuentas]
  );

  if (loading) return <LoadingState message="Cargando movimientos..." />;

  return (
    <>
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={movimientos}
          enablePagination={false}
          emptyMessage="No hay movimientos registrados"
        />
      </div>
      <div className="md:hidden space-y-3">
        {movimientos.length === 0 ? (
          <p className="text-center text-muted-foreground">No hay movimientos registrados</p>
        ) : (
          movimientos.map((mov) => {
            const cuenta = cuentas.find((c) => c.id === mov.cuenta_id);
            return (
              <div key={mov.id} className="rounded-lg border p-4">
                <div className="mb-2 flex justify-between">
                  <Badge variant={mov.tipo === 'INGRESO' ? 'success' : 'destructive'}>{mov.tipo}</Badge>
                  <span className={mov.tipo === 'INGRESO' ? 'font-bold text-emerald-600' : 'font-bold text-red-600'}>
                    {formatCurrency(mov.monto)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{formatDate(mov.fecha)}</p>
                <p className="text-sm">{cuenta?.nombre}</p>
                <p className="text-sm">{mov.origen}</p>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
