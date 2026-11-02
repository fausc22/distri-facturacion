import { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import { FileDown, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { axiosAuth } from '../../utils/apiClient';
import { usePeriodoReportes } from '../../hooks/usePeriodoReportes';
import { SelectorPeriodoReportes } from './SelectorPeriodoReportes';
import { Button } from '@/components/ui/button';
import { PanelCard } from '@/components/shared/PanelCard';
import { DataTable } from '@/components/tables/DataTable';
import { LoadingState, ErrorState } from '@/components/shared/StateViews';
import { useReportesUIStore } from '@/stores/reportesUIStore';

export const formatReportMoney = (value) => {
  if (value == null) return 'No disponible';
  const [whole, fraction = '00'] = String(value).split('.');
  return `$ ${whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${fraction.padEnd(2, '0')}`;
};
const moneySort = (a, b, key) => {
  const parse = (v) => BigInt(String(v ?? '0.00').replace('.', ''));
  const av = parse(a.original[key]);
  const bv = parse(b.original[key]);
  return av === bv ? 0 : av > bv ? 1 : -1;
};
const column = (key, label, monetary = false) => ({
  accessorKey: key,
  header: label,
  ...(monetary
    ? {
        cell: ({ row }) => (
          <span className="whitespace-nowrap tabular-nums">
            {formatReportMoney(row.original[key])}
          </span>
        ),
        sortingFn: moneySort,
      }
    : {}),
});
const totalsColumns = [
  column('nombre', 'Grupo'),
  column('documentos', 'Documentos'),
  column('total', 'Total', true),
  column('normal', 'Normales', true),
  column('flete', 'Con flete', true),
  column('pendiente', 'Pendientes', true),
  {
    accessorKey: 'porcentaje_total',
    header: '% del total neto',
    cell: ({ row }) =>
      row.original.porcentaje_total == null
        ? 'No disponible'
        : `${row.original.porcentaje_total}%`,
  },
];
const documentColumns = [
  column('numero', 'Comprobante'),
  column('fecha', 'Fecha fiscal'),
  column('tipo', 'Tipo'),
  column('fiscal', 'Letra'),
  column('cliente', 'Cliente'),
  column('vendedor', 'Vendedor imputado'),
  column('segmento', 'Segmento'),
  column('total', 'Importe final', true),
];
const lineColumns = [
  column('numero', 'Comprobante'),
  column('fecha', 'Fecha'),
  column('producto', 'Producto/servicio'),
  column('unidad', 'Unidad'),
  column('cantidad', 'Cantidad'),
  column('cliente', 'Cliente'),
  column('vendedor', 'Vendedor'),
  column('neto', 'Neto guardado', true),
  column('iva', 'IVA', true),
  column('total_linea', 'Total línea', true),
];
const tabs = [
  ['gerencial', 'Reporte Gerencial'],
  ['ventas', 'Análisis de Ventas'],
  ['resultado', 'Facturación y egresos'],
  ['financiero', 'Movimientos de fondos'],
  ['productos', 'Análisis de Productos'],
  ['consulta', 'Consulta comercial'],
  ['geografico', 'Análisis Geográfico'],
];
const filterClass =
  'rounded-md border border-input bg-background px-3 py-2 text-sm';
function Metrics({ items }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const content = (
          <>
            <span className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {item.label}
            </span>
            <span className="mt-2 block break-words text-2xl font-bold tabular-nums">
              {item.raw ? item.value : formatReportMoney(item.value)}
            </span>
            {item.note && (
              <span className="mt-2 block text-xs text-muted-foreground">
                {item.note}
              </span>
            )}
          </>
        );
        return item.onClick ? (
          <button
            key={item.label}
            className="rounded-xl border bg-card p-5 text-left shadow-sm transition hover:border-primary focus-visible:ring-2 focus-visible:ring-primary"
            onClick={item.onClick}
          >
            {content}
            <span className="mt-3 block text-xs text-primary">
              Ver comprobantes →
            </span>
          </button>
        ) : (
          <div
            key={item.label}
            className="rounded-xl border bg-card p-5 shadow-sm"
          >
            {content}
          </div>
        );
      })}
    </div>
  );
}
function ReportTable({ title, data, columns, onRowClick, note }) {
  return (
    <PanelCard title={title}>
      {note && <p className="mb-3 text-sm text-muted-foreground">{note}</p>}
      <DataTable
        data={data}
        columns={columns}
        pageSize={15}
        onRowClick={onRowClick}
      />
    </PanelCard>
  );
}
export default function FinancialReportsV2() {
  const { user } = useAuth();
  const router = useRouter();
  const period = usePeriodoReportes();
  const { rango } = period;
  const { tabActiva, setTabActiva } = useReportesUIStore();
  const [detail, setDetail] = useState(null);
  const detailRef = useRef(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState('todos');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const query = useQuery({
    queryKey: ['reportes-v2', user?.id, rango.desde, rango.hasta],
    enabled: user?.rol === 'GERENTE',
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
    queryFn: async () => {
      const response = await axiosAuth.get('/finanzas/reportes-v2', {
        params: { desde: rango.desde, hasta: rango.hasta },
      });
      if (!response.data?.success)
        throw new Error(
          response.data?.message || 'No se pudo construir el reporte.'
        );
      return response.data.data;
    },
  });
  useEffect(() => {
    if (user && user.rol !== 'GERENTE') router.replace('/inicio');
  }, [user, router]);
  useEffect(() => {
    setDetail(null);
    setSelectedDocument(null);
    setPdfError('');
    setSearch('');
    setSegment('todos');
  }, [rango.desde, rango.hasta]);
  useEffect(() => {
    setSelectedDocument(null);
    if (detail)
      detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [detail]);
  const data = query.data;
  const reload = async () => {
    setPdfError('');
    setSelectedDocument(null);
    return query.refetch();
  };
  const download = async () => {
    setPdfBusy(true);
    setPdfError('');
    try {
      const response = await axiosAuth.get(
        `/finanzas/reportes-v2/${data.snapshot_id}/pdf`,
        { responseType: 'arraybuffer' }
      );
      const bytes = new Uint8Array(response.data);
      if (String.fromCharCode(...bytes.slice(0, 5)) !== '%PDF-')
        throw new Error('La respuesta no es un PDF válido.');
      const url = URL.createObjectURL(
        new Blob([bytes], { type: 'application/pdf' })
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte_gerencial_${data.periodo.desde}_${data.periodo.hasta}.pdf`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      if (error.response?.status === 410) {
        await query.refetch();
        setPdfError(
          'La versión anterior venció. Se solicitó una actualización: revise la nueva fecha de corte antes de descargar nuevamente.'
        );
      } else setPdfError(error.message || 'No se pudo descargar el PDF.');
    } finally {
      setPdfBusy(false);
    }
  };
  const documents = useMemo(() => {
    if (!data) return [];
    return data.documentos.filter(
      (r) =>
        !detail ||
        (detail.segmento
          ? r.segmento === detail.segmento
          : detail.mes
            ? r.fecha.startsWith(detail.mes)
            : detail.vendedor != null
              ? String(r.vendedor_id ?? 'sin-vendedor') === detail.vendedor
              : detail.ciudad
                ? JSON.stringify([r.ciudad, r.provincia]) === detail.ciudad
                : detail.fiscal
                  ? detail.fiscal === 'AB'
                    ? ['A', 'B'].includes(r.fiscal)
                    : r.fiscal === detail.fiscal
                  : true)
    );
  }, [data, detail]);
  const filteredLines = useMemo(
    () =>
      (data?.lineas || []).filter(
        (r) =>
          (segment === 'todos' || r.segmento === segment) &&
          [r.producto, r.numero, r.cliente, r.vendedor].some((v) =>
            v.toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es'))
          )
      ),
    [data, segment, search]
  );
  const filteredLineTotal = useMemo(() => {
    const cents = filteredLines.reduce(
      (n, r) => n + BigInt(r.total_linea.replace('.', '')),
      0n
    );
    const abs = cents < 0n ? -cents : cents;
    return `${cents < 0n ? '-' : ''}${abs / 100n}.${String(abs % 100n).padStart(2, '0')}`;
  }, [filteredLines]);
  if (!user || user.rol !== 'GERENTE')
    return <LoadingState message="Verificando acceso de gerente..." />;
  const tab = tabs.some(([key]) => key === tabActiva) ? tabActiva : 'gerencial';
  const s = data?.resumen;
  const openAll = () => setDetail({ label: 'Todos los comprobantes' });
  return (
    <main className="mx-auto max-w-7xl space-y-5 p-3 sm:p-6">
      <Head>
        <title>VERTIMAR | Reportes financieros</title>
      </Head>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            VERTIMAR · Gerencia
          </p>
          <h1 className="mt-1 text-3xl font-bold">Reportes financieros</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Facturación trazable, compras y movimientos de fondos.
          </p>
        </div>
        <Button
          onClick={download}
          disabled={!data || query.isFetching || pdfBusy || query.isError}
        >
          <FileDown className="mr-2 h-4 w-4" />
          {pdfBusy ? 'Generando PDF…' : 'Descargar PDF gerencial'}
        </Button>
      </header>
      <SelectorPeriodoReportes
        {...period}
        onRecargar={reload}
        loading={query.isFetching}
      />
      {query.isError && (
        <ErrorState
          message={`${query.error?.response?.data?.message || query.error?.message}. ${data ? 'Se conserva la lectura anterior; actualice antes de usarla.' : ''}`}
          onRetry={reload}
        />
      )}
      {pdfError && (
        <div
          role="alert"
          className="rounded-lg border border-amber-400 bg-amber-50 p-4 text-sm text-amber-950"
        >
          {pdfError}
        </div>
      )}
      {query.isFetching && !data && (
        <LoadingState message="Leyendo y conciliando los comprobantes…" />
      )}
      {data && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
            <span>
              Corte:{' '}
              {new Date(data.generado_en).toLocaleString('es-AR', {
                timeZone: 'America/Argentina/Cordoba',
              })}{' '}
              · {data.periodo.desde} al {data.periodo.hasta} · ARS
            </span>
            <span title={data.snapshot_id}>
              Versión {data.version} · {data.snapshot_id.slice(0, 8)}
            </span>
          </div>
          <div
            className={`flex items-start gap-3 rounded-lg border p-4 ${data.conciliacion.clasificacion_completa ? 'border-emerald-300 bg-emerald-50 text-emerald-950' : 'border-amber-300 bg-amber-50 text-amber-950'}`}
          >
            {data.conciliacion.clasificacion_completa ? (
              <CheckCircle2 className="h-5 w-5 shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 shrink-0" />
            )}
            <div>
              <p className="font-semibold">
                {data.conciliacion.clasificacion_completa
                  ? 'Facturación conciliada aritméticamente'
                  : `${s.documentos_pendientes} comprobantes pendientes de clasificación`}
              </p>
              <p className="text-sm">
                Total = normales + con flete + pendientes. Los documentos
                pendientes permanecen incluidos.{' '}
                {data.alertas.length > 0
                  ? `${data.alertas.length} alertas disponibles al pie del reporte.`
                  : 'Sin alertas de integridad detectadas.'}
              </p>
            </div>
          </div>
          <nav
            aria-label="Pestañas del reporte"
            className="flex gap-1 overflow-x-auto border-b"
          >
            {tabs.map(([key, label]) => (
              <button
                key={key}
                aria-current={tab === key ? 'page' : undefined}
                className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm ${tab === key ? 'border-primary font-semibold text-primary' : 'border-transparent text-muted-foreground'}`}
                onClick={() => {
                  setTabActiva(key);
                  setDetail(null);
                  setSelectedDocument(null);
                }}
              >
                {label}
              </button>
            ))}
          </nav>
          {['gerencial', 'ventas'].includes(tab) && (
            <>
              <Metrics
                items={[
                  {
                    label: 'Facturación total',
                    value: s.total,
                    onClick: openAll,
                    note: 'Importe final de documentos; NC restan',
                  },
                  {
                    label: 'Documentos normales',
                    value: s.normal,
                    onClick: () =>
                      setDetail({
                        segmento: 'normal',
                        label: 'Documentos normales',
                      }),
                    note: 'Sin fletes',
                  },
                  {
                    label: 'Documentos con flete',
                    value: s.flete,
                    onClick: () =>
                      setDetail({
                        segmento: 'flete',
                        label: 'Documentos con flete',
                      }),
                    note: 'Incluye toda la factura mixta',
                  },
                  {
                    label: 'Pendiente de clasificación',
                    value: s.pendiente,
                    onClick: () =>
                      setDetail({
                        segmento: 'pendiente',
                        label: 'Pendientes de clasificación',
                      }),
                    note: `${s.documentos_pendientes} comprobantes`,
                  },
                ]}
              />
              <Metrics
                items={[
                  { label: 'Facturas', value: s.facturas, raw: true },
                  {
                    label: 'Notas de débito',
                    value: s.notas_debito,
                    raw: true,
                  },
                  {
                    label: 'Notas de crédito',
                    value: s.notas_credito,
                    raw: true,
                  },
                  {
                    label: 'Ticket de factura',
                    value: s.ticket_factura,
                    note: 'Promedio solo de FACTURAS; excluye ND/NC',
                  },
                ]}
              />
              <Metrics
                items={[
                  {
                    label: 'A/B · total final',
                    value: s.ab,
                    onClick: () =>
                      setDetail({ fiscal: 'AB', label: 'Comprobantes A/B' }),
                  },
                  {
                    label: 'X · total final',
                    value: s.x,
                    onClick: () =>
                      setDetail({ fiscal: 'X', label: 'Comprobantes X' }),
                  },
                  { label: 'Neto guardado', value: s.neto },
                  { label: 'IVA guardado', value: s.iva },
                ]}
              />
              {s.otros !== '0.00' && (
                <p className="text-sm">
                  Otros tipos fiscales: {formatReportMoney(s.otros)}. Incluidos
                  en la facturación total.
                </p>
              )}
              {tab === 'gerencial' && (
                <PanelCard title="Lectura del período">
                  <ul className="list-disc space-y-2 pl-5 text-sm">
                    {data.comentarios.length ? (
                      data.comentarios.map((v, i) => <li key={i}>{v}</li>)
                    ) : (
                      <li>
                        Sin excepciones detectadas por los controles
                        disponibles.
                      </li>
                    )}
                  </ul>
                  <div className="mt-4 rounded-lg bg-muted/40 p-4 text-sm">
                    <p>
                      Anterior ({data.comparacion.periodo.desde} al{' '}
                      {data.comparacion.periodo.hasta}):{' '}
                      <strong>
                        {formatReportMoney(data.comparacion.resumen.total)}
                      </strong>
                    </p>
                    <p>
                      Diferencia:{' '}
                      <strong>
                        {formatReportMoney(data.comparacion.diferencia)}
                      </strong>{' '}
                      · Variación:{' '}
                      {data.comparacion.porcentaje == null
                        ? data.comparacion.comparable
                          ? 'No calculable con base no positiva'
                          : 'No disponible en período abierto'
                        : `${data.comparacion.porcentaje}%`}
                    </p>
                    <p className="mt-2 text-muted-foreground">
                      {data.comparacion.criterio}
                    </p>
                  </div>
                </PanelCard>
              )}
              <ReportTable
                title="Evolución mensual"
                data={data.meses}
                columns={totalsColumns}
                note="Seleccione un mes para ver sus comprobantes."
                onRowClick={(r) =>
                  setDetail({ mes: r.id, label: `Comprobantes de ${r.nombre}` })
                }
              />
              <ReportTable
                title="Vendedores · facturación final"
                data={data.vendedores}
                columns={totalsColumns}
                note="Todos los vendedores. Las notas se imputan al vendedor de la factura original cuando existe referencia. Seleccione una fila para ver el detalle."
                onRowClick={(r) =>
                  setDetail({
                    vendedor: r.id,
                    label: `Comprobantes de ${r.nombre}`,
                  })
                }
              />
            </>
          )}
          {tab === 'productos' && (
            <>
              <Metrics
                items={[
                  {
                    label: 'Neto de todas las líneas',
                    value: data.productos_totales.neto,
                  },
                  {
                    label: 'IVA de todas las líneas',
                    value: data.productos_totales.iva,
                  },
                  {
                    label: 'Total de líneas',
                    value: data.productos_totales.total_lineas,
                  },
                  {
                    label: 'Ajustes contra cabeceras',
                    value: data.productos_totales.ajuste_cabeceras,
                    note: 'No se distribuyen artificialmente entre productos',
                  },
                ]}
              />
              <ReportTable
                title="Todos los productos y servicios"
                note="Incluye fletes, devoluciones y cantidades cero/negativas. Cantidades por unidad; no se suman kilos y unidades. Neto e IVA guardados, con descuentos de línea."
                data={data.productos}
                columns={[
                  column('nombre', 'Producto/servicio'),
                  column('unidad', 'Unidad'),
                  column('cantidad', 'Cantidad neta'),
                  column('documentos', 'Documentos'),
                  column('neto', 'Neto', true),
                  column('iva', 'IVA', true),
                  column('total_linea', 'Total líneas', true),
                ]}
              />
            </>
          )}
          {tab === 'geografico' && (
            <>
              <Metrics
                items={[
                  { label: 'Facturación global', value: s.total },
                  { label: 'Ciudades', value: data.ciudades.length, raw: true },
                  {
                    label: 'Clientes únicos con ID',
                    value: s.clientes,
                    raw: true,
                    note: 'Distintos sobre todo el período; no suma por ciudad',
                  },
                  { label: 'Documentos', value: s.documentos, raw: true },
                ]}
              />
              <ReportTable
                title="Todas las ciudades"
                note="Sin recortar a un ranking. Seleccione una fila para consultar los documentos."
                data={data.ciudades}
                columns={totalsColumns}
                onRowClick={(r) =>
                  setDetail({
                    ciudad: r.id,
                    label: `Comprobantes de ${r.nombre}`,
                  })
                }
              />
            </>
          )}
          {tab === 'consulta' && (
            <PanelCard title="Consulta de líneas comerciales">
              <p className="mb-4 text-sm text-muted-foreground">
                Importes guardados por línea, no precio × cantidad. Fecha
                fiscal. Incluye fletes y devoluciones; ajustes globales se
                consultan en Productos.
              </p>
              <div className="mb-4 flex flex-wrap gap-3">
                <input
                  className={filterClass}
                  aria-label="Buscar producto, cliente, vendedor o comprobante"
                  placeholder="Producto, cliente, vendedor, comprobante"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select
                  className={filterClass}
                  aria-label="Segmento de facturación"
                  value={segment}
                  onChange={(e) => setSegment(e.target.value)}
                >
                  <option value="todos">Todos los segmentos</option>
                  <option value="normal">Normal</option>
                  <option value="flete">Con flete</option>
                  <option value="pendiente">Pendiente</option>
                </select>
              </div>
              <p className="mb-3 text-sm">
                {filteredLines.length} líneas · Importe de líneas filtradas:{' '}
                <strong>{formatReportMoney(filteredLineTotal)}</strong>
              </p>
              <DataTable
                data={filteredLines}
                columns={lineColumns}
                pageSize={20}
              />
            </PanelCard>
          )}
          {tab === 'resultado' && (
            <>
              <Metrics
                items={[
                  {
                    label: 'Facturación final',
                    value: s.total,
                    onClick: openAll,
                  },
                  {
                    label: 'Compras',
                    value: data.resultado.compras,
                    note: 'Registradas y confirmadas; excluye anuladas',
                  },
                  { label: 'Gastos', value: data.resultado.gastos },
                  {
                    label: 'Diferencia',
                    value: data.resultado.diferencia,
                    note: 'Facturación menos compras y gastos',
                  },
                ]}
              />
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
                <strong>Ganancia histórica: no disponible.</strong>{' '}
                {data.resultado.motivo}
              </div>
              <ReportTable
                title="Compras del período · incluye anuladas para control"
                data={data.compras}
                columns={[
                  column('id', 'ID'),
                  column('fecha', 'Fecha'),
                  column('estado', 'Estado'),
                  column('cuenta_id', 'Cuenta ID'),
                  column('total', 'Importe', true),
                ]}
              />
              <ReportTable
                title="Gastos del período"
                data={data.gastos}
                columns={[
                  column('id', 'ID'),
                  column('fecha', 'Fecha'),
                  column('descripcion', 'Descripción'),
                  column('monto', 'Importe', true),
                ]}
              />
            </>
          )}
          {tab === 'financiero' && (
            <>
              <Metrics
                items={[
                  { label: 'Ingresos externos', value: data.caja.ingresos },
                  { label: 'Egresos externos', value: data.caja.egresos },
                  {
                    label: 'Transferencias · entrada',
                    value: data.caja.transferencias_entrada,
                  },
                  {
                    label: 'Variación de fondos',
                    value: data.caja.variacion,
                    note: 'No representa saldo final ni rentabilidad',
                  },
                ]}
              />
              <ReportTable
                title="Movimientos por cuenta"
                note="Día final completo. Transferencias separadas. Saldo inicial y final no certificados; se informa variación del período."
                data={data.caja.cuentas}
                columns={[
                  column('nombre', 'Cuenta'),
                  column('ingresos', 'Ingresos externos', true),
                  column('egresos', 'Egresos externos', true),
                  column('transferencias_entrada', 'Transfer. entrada', true),
                  column('transferencias_salida', 'Transfer. salida', true),
                  column('variacion', 'Variación', true),
                ]}
              />
              <ReportTable
                title="Detalle de movimientos"
                data={data.caja.movimientos}
                columns={[
                  column('id', 'ID'),
                  column('fecha', 'Fecha'),
                  column('cuenta', 'Cuenta'),
                  column('tipo', 'Tipo'),
                  column('origen', 'Origen'),
                  column('monto', 'Importe', true),
                ]}
              />
            </>
          )}
          {detail && (
            <div ref={detailRef} className="scroll-mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">{detail.label}</h2>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDetail(null);
                    setSelectedDocument(null);
                  }}
                >
                  Cerrar detalle
                </Button>
              </div>
              <DataTable
                data={documents}
                columns={documentColumns}
                pageSize={15}
                onRowClick={(r) => setSelectedDocument(r)}
              />
              <p className="text-xs text-muted-foreground">
                Seleccione un comprobante para revisar sus líneas y alertas.
              </p>
              {selectedDocument && (
                <PanelCard
                  title={`${selectedDocument.numero} · ID ${selectedDocument.id}`}
                >
                  <p className="mb-3 text-sm">
                    Fecha comercial: {selectedDocument.fecha_comercial} ·
                    Emisor: {selectedDocument.vendedor_emisor} · Diferencia
                    cabecera/líneas:{' '}
                    {formatReportMoney(selectedDocument.ajuste_lineas)}
                  </p>
                  <p className="mb-3 text-sm">
                    Controles:{' '}
                    {data.alertas
                      .filter((r) => r.documento_id === selectedDocument.id)
                      .map((r) => r.descripcion)
                      .join('; ') || 'Sin alertas detectadas'}
                  </p>
                  <DataTable
                    data={data.lineas.filter(
                      (r) => r.documento_id === selectedDocument.id
                    )}
                    columns={lineColumns}
                    pageSize={10}
                  />
                </PanelCard>
              )}
            </div>
          )}
          <details className="rounded-lg border bg-card p-4">
            <summary className="cursor-pointer font-semibold">
              Conciliación, alertas y reglas de cálculo
            </summary>
            <div className="mt-4 space-y-5">
              <Metrics
                items={[
                  { label: 'A/B en reporte', value: s.ab },
                  {
                    label: 'Libro IVA A/B',
                    value: data.conciliacion.libro_iva,
                  },
                  {
                    label: 'Diferencia con libro',
                    value: data.conciliacion.diferencia_iva,
                  },
                  {
                    label: 'Listado comercial',
                    value: data.conciliacion.comercial,
                    note: 'Otra base: subtotal A/B; total otras letras; fecha comercial',
                  },
                ]}
              />
              <ReportTable
                title="Vendedores según listado comercial"
                data={data.conciliacion.vendedores_comerciales}
                columns={[
                  column('nombre', 'Vendedor'),
                  column('documentos', 'Documentos'),
                  column('total', 'Importe comercial', true),
                ]}
              />
              <ReportTable
                title="Conciliación por comprobante"
                note="Los importes no son intercambiables: revise alcance, fecha y base. Un cero puede significar exclusión; las columnas de inclusión lo identifican."
                data={data.conciliacion.documentos}
                columns={[
                  column('numero', 'Comprobante'),
                  column('fecha', 'Fiscal'),
                  column('fecha_comercial', 'Comercial'),
                  ...['en_reporte', 'en_libro', 'en_listado'].map((key, i) => ({
                    accessorKey: key,
                    header: ['En reporte', 'En libro', 'En listado'][i],
                    cell: ({ row }) => (row.original[key] ? 'Sí' : 'No'),
                  })),
                  column('reporte', 'Reporte', true),
                  column('libro', 'Libro', true),
                  column('comercial', 'Comercial', true),
                  {
                    accessorKey: 'razones',
                    header: 'Motivos',
                    cell: ({ row }) => row.original.razones.join('; '),
                  },
                ]}
              />
              <ReportTable
                title="Resumen de controles"
                data={data.alertas_resumen}
                columns={[
                  column('descripcion', 'Control'),
                  column('cantidad', 'Cantidad'),
                ]}
              />
              <ReportTable
                title={`Alertas (${data.alertas.length})`}
                data={data.alertas}
                columns={[
                  column('documento_id', 'ID'),
                  column('numero', 'Comprobante'),
                  column('descripcion', 'Control'),
                  column('nivel', 'Prioridad'),
                  column('importe', 'Importe final', true),
                  column('diferencia', 'Ajuste líneas', true),
                ]}
              />
              <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                {data.metodologia.map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ol>
            </div>
          </details>
        </>
      )}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => router.push('/inicio')}>
          Volver al menú
        </Button>
        <Button variant="outline" onClick={reload} disabled={query.isFetching}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualizar lectura
        </Button>
      </div>
    </main>
  );
}
