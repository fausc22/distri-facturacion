import React, { useMemo } from 'react';
import { DataTable } from '@/components/tables/DataTable';
import { Badge } from '@/components/ui/badge';
import { LoadingState, EmptyState } from '@/components/shared/StateViews';
import { formatearMoneda } from '../../utils/formatearMoneda';
import { cn } from '@/lib/utils';

const formatearFecha = (fecha) => {
  if (!fecha) return 'Fecha no disponible';
  return new Date(fecha).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const documentoVariant = (tipoDoc) => {
  switch (tipoDoc) {
    case 'FACTURA':
      return 'default';
    case 'NOTA_DEBITO':
      return 'warning';
    case 'NOTA_CREDITO':
      return 'success';
    default:
      return 'secondary';
  }
};

const tipoFiscalVariant = (tipoF) => {
  switch (tipoF) {
    case 'A':
      return 'default';
    case 'B':
      return 'secondary';
    case 'C':
    case 'X':
      return 'outline';
    default:
      return 'secondary';
  }
};

const desglosarNumeroFactura = (numeroCompleto, tipoDoc) => {
  if (!numeroCompleto || typeof numeroCompleto !== 'string') {
    return {
      tipoFactura: '-',
      puntoVenta: '-',
      numeroComprobante: '-',
      numeroCompleto: '-',
      esNota: false,
    };
  }

  const esNota = tipoDoc === 'NOTA_DEBITO' || tipoDoc === 'NOTA_CREDITO';

  if (esNota) {
    const regexNota = /^(\d{4})-(\d{5})$/;
    const matchNota = numeroCompleto.trim().match(regexNota);

    if (matchNota) {
      return {
        tipoFactura: tipoDoc === 'NOTA_DEBITO' ? 'ND' : 'NC',
        puntoVenta: matchNota[1],
        numeroComprobante: matchNota[2],
        numeroCompleto,
        esNota: true,
      };
    }

    return {
      tipoFactura: tipoDoc === 'NOTA_DEBITO' ? 'ND' : 'NC',
      puntoVenta: '-',
      numeroComprobante: '-',
      numeroCompleto,
      esNota: true,
    };
  }

  const regexFactura = /^([A-Z]+)\s+(\d{4})-(\d{8})$/;
  const matchFactura = numeroCompleto.trim().match(regexFactura);

  if (!matchFactura) {
    return {
      tipoFactura: '-',
      puntoVenta: '-',
      numeroComprobante: '-',
      numeroCompleto,
      esNota: false,
    };
  }

  return {
    tipoFactura: matchFactura[1],
    puntoVenta: matchFactura[2],
    numeroComprobante: matchFactura[3],
    numeroCompleto,
    esNota: false,
  };
};

function ResumenVentas({ ventas, selectedVentas }) {
  const montoTotal = ventas.reduce((acc, v) => acc + Number(v.total || 0), 0);

  return (
    <div className="border-b bg-muted/30 px-4 py-3">
      <div className="flex flex-col justify-between gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center">
        <span>
          {selectedVentas.length > 0 && (
            <span className="font-medium text-primary">
              {selectedVentas.length} de {ventas.length} seleccionados
            </span>
          )}
        </span>
        <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
          <span>
            Total de ventas: <strong className="text-foreground">{ventas.length}</strong>
          </span>
          <span>
            Monto total:{' '}
            <strong className="text-emerald-600">{formatearMoneda(montoTotal)}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}

function TarjetasMovil({ ventas, selectedVentas, onSelectAll, onSelectVenta, onRowDoubleClick }) {
  const todosSeleccionados = ventas.length > 0 && selectedVentas.length === ventas.length;

  return (
    <div className="lg:hidden">
      <div className="mb-4 flex min-h-[52px] items-center justify-between rounded-t-lg bg-muted/50 p-3">
        <label className="flex min-h-[44px] flex-1 cursor-pointer items-center gap-2 py-2">
          <input
            type="checkbox"
            checked={todosSeleccionados}
            onChange={onSelectAll}
            className="h-4 w-4 rounded border-input"
            aria-label="Seleccionar todas"
          />
          <span className="text-sm font-medium">Seleccionar todos ({ventas.length})</span>
        </label>
        {selectedVentas.length > 0 && (
          <span className="text-sm font-medium text-primary">
            {selectedVentas.length} seleccionados
          </span>
        )}
      </div>

      <div className="space-y-3">
        {ventas.map((venta) => {
          const numero = desglosarNumeroFactura(venta.numero_factura, venta.tipo_doc);
          const isSelected = selectedVentas.includes(venta.id);

          return (
            <div
              key={venta.id}
              role="button"
              tabIndex={0}
              className={cn(
                'touch-manipulation cursor-pointer rounded-lg border-2 p-4 transition-all select-none active:scale-[0.98] active:shadow-none',
                isSelected
                  ? 'border-primary/40 bg-primary/5 shadow-md'
                  : 'border-border hover:border-muted-foreground/30 hover:shadow-sm'
              )}
              onClick={() => onRowDoubleClick(venta)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onRowDoubleClick(venta);
                }
              }}
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex min-h-[44px] items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onSelectVenta(venta.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-4 w-4 rounded border-input"
                    aria-label={`Seleccionar venta ${venta.id}`}
                  />
                  <div>
                    {numero.numeroCompleto !== '-' ? (
                      <div
                        className={cn(
                          'font-mono text-sm font-bold',
                          numero.esNota ? 'text-purple-600' : 'text-primary'
                        )}
                      >
                        {numero.numeroCompleto}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">Sin número de factura</div>
                    )}
                    <p className="text-xs text-muted-foreground">{formatearFecha(venta.fecha)}</p>
                  </div>
                </div>
                <Badge variant={venta.cae_id ? 'success' : 'destructive'}>
                  {venta.cae_id ? 'CAE' : 'Pendiente'}
                </Badge>
              </div>

              <div className="mb-3 rounded-lg bg-muted/30 p-3">
                <h4 className="font-semibold">
                  {venta.cliente_nombre || 'Cliente no especificado'}
                </h4>
                {venta.cliente_ciudad && (
                  <p className="text-sm text-muted-foreground">{venta.cliente_ciudad}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded bg-emerald-50 p-2 text-center dark:bg-emerald-950/30">
                  <div className="text-lg font-bold text-emerald-600">
                    {formatearMoneda(venta.total || 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
                <div className="rounded bg-blue-50 p-2 text-center dark:bg-blue-950/30">
                  <div className="truncate text-sm font-bold text-blue-600">
                    {venta.empleado_nombre || 'No especificado'}
                  </div>
                  <div className="text-xs text-muted-foreground">Vendedor</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TablaVentas({
  ventas,
  selectedVentas,
  onSelectVenta,
  onSelectAll,
  onRowDoubleClick,
  loading,
}) {
  const todosSeleccionados = ventas.length > 0 && selectedVentas.length === ventas.length;

  const columns = useMemo(
    () => [
      {
        id: 'select',
        header: () => (
          <input
            type="checkbox"
            checked={todosSeleccionados}
            onChange={onSelectAll}
            className="h-4 w-4 rounded border-input"
            aria-label="Seleccionar todas"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={selectedVentas.includes(row.original.id)}
            onChange={() => onSelectVenta(row.original.id)}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 rounded border-input"
            aria-label={`Seleccionar venta ${row.original.id}`}
          />
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'fecha',
        header: 'Fecha',
        cell: ({ row }) => formatearFecha(row.original.fecha),
      },
      {
        accessorKey: 'cliente_nombre',
        header: 'Cliente',
        cell: ({ row }) => (
          <div>
            <div className="font-medium">
              {row.original.cliente_nombre || 'Cliente no especificado'}
            </div>
            {row.original.cliente_ciudad && (
              <div className="text-xs text-muted-foreground">{row.original.cliente_ciudad}</div>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'numero_factura',
        header: 'Número factura',
        cell: ({ row }) => {
          const numero = desglosarNumeroFactura(
            row.original.numero_factura,
            row.original.tipo_doc
          );
          if (numero.numeroCompleto === '-') {
            return <span className="text-xs text-muted-foreground">Sin número</span>;
          }
          if (numero.esNota) {
            return (
              <span className="font-mono text-sm font-bold text-purple-600">
                {numero.numeroCompleto}
              </span>
            );
          }
          return (
            <div className="font-mono text-sm">
              <div className="font-bold text-primary">{numero.tipoFactura}</div>
              <div className="text-xs text-muted-foreground">
                {numero.puntoVenta}-{numero.numeroComprobante}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'tipo_doc',
        header: 'Documento',
        cell: ({ row }) => (
          <Badge variant={documentoVariant(row.original.tipo_doc)}>
            {row.original.tipo_doc || 'N/A'}
          </Badge>
        ),
      },
      {
        accessorKey: 'tipo_f',
        header: 'Tipo fiscal',
        cell: ({ row }) => (
          <Badge variant={tipoFiscalVariant(row.original.tipo_f)}>
            {row.original.tipo_f || 'N/A'}
          </Badge>
        ),
      },
      {
        accessorKey: 'total',
        header: 'Total',
        cell: ({ row }) => (
          <div className="text-right">
            <div className="font-semibold text-emerald-600">
              {formatearMoneda(row.original.total || 0)}
            </div>
            {row.original.subtotal && (
              <div className="text-xs text-muted-foreground">
                Subtotal: {formatearMoneda(row.original.subtotal || 0)}
              </div>
            )}
          </div>
        ),
      },
      {
        id: 'cae',
        header: 'Estado CAE',
        cell: ({ row }) => (
          <Badge variant={row.original.cae_id ? 'success' : 'destructive'}>
            {row.original.cae_id ? 'Aprobado' : 'Pendiente'}
          </Badge>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'empleado_nombre',
        header: 'Vendedor',
        cell: ({ row }) => row.original.empleado_nombre || 'No especificado',
      },
    ],
    [selectedVentas, todosSeleccionados, onSelectAll, onSelectVenta]
  );

  if (loading) {
    return (
      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <LoadingState message="Cargando ventas..." />
      </div>
    );
  }

  if (ventas.length === 0) {
    return (
      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <EmptyState message="No hay ventas registradas" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <ResumenVentas ventas={ventas} selectedVentas={selectedVentas} />

      <div className="hidden p-4 lg:block">
        <DataTable
          columns={columns}
          data={ventas}
          enablePagination={false}
          enableSorting
          onRowClick={(venta) => onSelectVenta(venta.id)}
          onRowDoubleClick={onRowDoubleClick}
          getRowClassName={(venta) =>
            selectedVentas.includes(venta.id) ? 'bg-primary/5' : undefined
          }
          getRowId={(row) => String(row.id)}
          emptyMessage="No hay ventas registradas"
        />
      </div>

      <div className="p-4 lg:hidden">
        <TarjetasMovil
          ventas={ventas}
          selectedVentas={selectedVentas}
          onSelectAll={onSelectAll}
          onSelectVenta={onSelectVenta}
          onRowDoubleClick={onRowDoubleClick}
        />
      </div>
    </div>
  );
}

export default React.memo(TablaVentas);
