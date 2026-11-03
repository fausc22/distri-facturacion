import { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import { FileDown, RefreshCw } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { axiosAuth } from '../../utils/apiClient';
import { usePeriodoReportes, MESES_REPORTES } from '../../hooks/usePeriodoReportes';
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

/** Absorbe pendiente en normales solo para mostrar al gerente. */
export const displayResumen = (resumen) => {
  if (!resumen) return resumen;
  const toCents = (v) => BigInt(String(v ?? '0.00').replace('.', ''));
  const fromCents = (c) => {
    const neg = c < 0n;
    const abs = neg ? -c : c;
    return `${neg ? '-' : ''}${abs / 100n}.${String(abs % 100n).padStart(2, '0')}`;
  };
  return {
    ...resumen,
    normal: fromCents(toCents(resumen.normal) + toCents(resumen.pendiente)),
    pendiente: '0.00',
    documentos_pendientes: 0,
  };
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
  {
    accessorKey: 'porcentaje_total',
    header: '% del total neto',
    cell: ({ row }) =>
      row.original.porcentaje_total == null
        ? 'No disponible'
        : `${row.original.porcentaje_total}%`,
  },
];
const pad2 = (n) => String(n).padStart(2, '0');
const monthKey = (anio, mes) => `${anio}-${pad2(mes)}`;
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

function ComparacionView({ periodos }) {
  const labels = (periodos || []).map((p) => {
    const key = p.periodo?.mes || p.periodo?.desde?.slice(0, 7) || '';
    const [y, m] = key.split('-');
    const mes = MESES_REPORTES.find((x) => x.value === Number(m));
    return mes ? `${mes.label} ${y}` : key;
  });
  const resumenes = (periodos || []).map((p) => displayResumen(p.resumen));
  const sellerNames = [
    ...new Set(
      (periodos || []).flatMap((p) => (p.vendedores || []).map((v) => v.nombre))
    ),
  ].sort((a, b) => a.localeCompare(b, 'es'));
  const sellerRows = sellerNames.map((nombre) => {
    const row = { nombre };
    periodos.forEach((p, i) => {
      const hit = (p.vendedores || []).find((v) => v.nombre === nombre);
      row[`m${i}`] = hit?.total || '0.00';
    });
    return row;
  });
  const sellerCols = [
    column('nombre', 'Vendedor'),
    ...labels.map((label, i) => column(`m${i}`, label, true)),
  ];
  return (
    <div className="space-y-5">
      <PanelCard title="Comparación de tres meses">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-2">Indicador</th>
                {labels.map((l) => (
                  <th key={l} className="p-2">
                    {l}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Facturación total', (s) => formatReportMoney(s.total)],
                ['A/B', (s) => formatReportMoney(s.ab)],
                ['X', (s) => formatReportMoney(s.x)],
                ['Notas de crédito', (s) => String(s.notas_credito)],
                ['Ticket de factura', (s) => formatReportMoney(s.ticket_factura)],
                ['Documentos', (s) => String(s.documentos)],
              ].map(([label, pick]) => (
                <tr key={label} className="border-b">
                  <td className="p-2 font-medium">{label}</td>
                  {resumenes.map((s, i) => (
                    <td key={i} className="p-2 tabular-nums">
                      {pick(s)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PanelCard>
      <ReportTable title="Vendedores" data={sellerRows} columns={sellerCols} />
    </div>
  );
}

export default function FinancialReportsV2() {
  const { user } = useAuth();
  const router = useRouter();
  const period = usePeriodoReportes();
  const { rango, aniosDisponibles } = period;
  const { tabActiva, setTabActiva } = useReportesUIStore();
  const [detail, setDetail] = useState(null);
  const detailRef = useRef(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState('todos');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [tipoReporte, setTipoReporte] = useState('mensual');
  const now = new Date();
  const [anioAnual, setAnioAnual] = useState(now.getFullYear());
  const [mesesComparacion, setMesesComparacion] = useState(() => {
    const base = new Date(now.getFullYear(), now.getMonth(), 1);
    return [0, 1, 2].map((offset) => {
      const d = new Date(base.getFullYear(), base.getMonth() - offset, 1);
      return { anio: d.getFullYear(), mes: d.getMonth() + 1 };
    });
  });
  const queryParams = useMemo(() => {
    if (tipoReporte === 'anual') return { tipo: 'anual', anio: String(anioAnual) };
    if (tipoReporte === 'comparacion') {
      const meses = mesesComparacion.map((m) => monthKey(m.anio, m.mes)).join(',');
      return { tipo: 'comparacion', meses };
    }
    return { tipo: 'mensual', desde: rango.desde, hasta: rango.hasta };
  }, [tipoReporte, anioAnual, mesesComparacion, rango.desde, rango.hasta]);
  const query = useQuery({
    queryKey: ['reportes-v2', user?.id, queryParams],
    enabled: user?.rol === 'GERENTE',
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
    queryFn: async () => {
      const response = await axiosAuth.get('/finanzas/reportes-v2', {
        params: queryParams,
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
  }, [queryParams]);
  useEffect(() => {
    setSelectedDocument(null);
    if (detail)
      detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [detail]);
  const data = query.data;
  const isComparacion = data?.tipo === 'comparacion';
  const reportView = isComparacion ? null : data;
  const s = displayResumen(reportView?.resumen);
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
      const name =
        data.tipo === 'comparacion'
          ? `reporte_comparacion_${String(queryParams.meses).replace(/,/g, '_')}.pdf`
          : data.tipo === 'anual'
            ? `reporte_anual_${data.anio}.pdf`
            : `reporte_gerencial_${data.periodo.desde}_${data.periodo.hasta}.pdf`;
      link.download = name;
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
    if (!reportView) return [];
    return reportView.documentos.filter(
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
  }, [reportView, detail]);
  const filteredLines = useMemo(
    () =>
      (reportView?.lineas || []).filter(
        (r) =>
          (segment === 'todos' || r.segmento === segment) &&
          [r.producto, r.numero, r.cliente, r.vendedor].some((v) =>
            v.toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es'))
          )
      ),
    [reportView, segment, search]
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
  const openAll = () => setDetail({ label: 'Todos los comprobantes' });
  const etiquetaCorte = isComparacion
    ? (data.periodos || [])
        .map((p) => p.periodo?.mes || p.periodo?.desde?.slice(0, 7))
        .join(' · ')
    : data?.periodo
      ? `${data.periodo.desde} al ${data.periodo.hasta}`
      : '';
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
            Facturación, compras y movimientos de fondos.
          </p>
        </div>
        <Button
          onClick={download}
          disabled={!data || query.isFetching || pdfBusy || query.isError}
        >
          <FileDown className="mr-2 h-4 w-4" />
          {pdfBusy ? 'Generando PDF…' : 'Descargar PDF'}
        </Button>
      </header>
      <div className="flex flex-wrap gap-2">
        {[
          ['mensual', 'Mensual'],
          ['comparacion', 'Comparación 3 meses'],
          ['anual', 'Anual'],
        ].map(([key, label]) => (
          <Button
            key={key}
            type="button"
            size="sm"
            variant={tipoReporte === key ? 'default' : 'outline'}
            onClick={() => setTipoReporte(key)}
          >
            {label}
          </Button>
        ))}
      </div>
      {tipoReporte === 'mensual' && (
        <SelectorPeriodoReportes
          {...period}
          onRecargar={reload}
          loading={query.isFetching}
        />
      )}
      {tipoReporte === 'anual' && (
        <div className="flex flex-wrap items-end gap-3 rounded-lg border p-4">
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Año calendario</span>
            <select
              className={filterClass}
              value={anioAnual}
              onChange={(e) => setAnioAnual(Number(e.target.value))}
            >
              {(aniosDisponibles || [now.getFullYear()]).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
          <Button type="button" variant="outline" size="sm" onClick={reload} disabled={query.isFetching}>
            {query.isFetching ? 'Cargando…' : 'Recargar'}
          </Button>
        </div>
      )}
      {tipoReporte === 'comparacion' && (
        <div className="space-y-3 rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">
            Elija tres meses distintos para comparar montos, vendedores, productos y clientes.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {mesesComparacion.map((item, idx) => (
              <div key={idx} className="flex flex-wrap gap-2">
                <select
                  className={filterClass}
                  aria-label={`Mes ${idx + 1}`}
                  value={item.mes}
                  onChange={(e) => {
                    const next = [...mesesComparacion];
                    next[idx] = { ...next[idx], mes: Number(e.target.value) };
                    setMesesComparacion(next);
                  }}
                >
                  {MESES_REPORTES.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <select
                  className={filterClass}
                  aria-label={`Año ${idx + 1}`}
                  value={item.anio}
                  onChange={(e) => {
                    const next = [...mesesComparacion];
                    next[idx] = { ...next[idx], anio: Number(e.target.value) };
                    setMesesComparacion(next);
                  }}
                >
                  {(aniosDisponibles || [now.getFullYear()]).map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={reload} disabled={query.isFetching}>
            {query.isFetching ? 'Cargando…' : 'Recargar'}
          </Button>
        </div>
      )}
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
        <LoadingState message="Leyendo comprobantes…" />
      )}
      {data && isComparacion && (
        <ComparacionView periodos={data.periodos || []} />
      )}
      {data && !isComparacion && s && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
            <span>
              Corte:{' '}
              {new Date(data.generado_en).toLocaleString('es-AR', {
                timeZone: 'America/Argentina/Cordoba',
              })}{' '}
              · {etiquetaCorte} · ARS
            </span>
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
                    note: 'NC restan del total',
                  },
                  {
                    label: 'Documentos normales',
                    value: s.normal,
                    onClick: () =>
                      setDetail({
                        segmento: 'normal',
                        label: 'Documentos normales',
                      }),
                  },
                  {
                    label: 'Documentos con flete',
                    value: s.flete,
                    onClick: () =>
                      setDetail({
                        segmento: 'flete',
                        label: 'Documentos con flete',
                      }),
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
                  { label: 'Neto', value: s.neto },
                  { label: 'IVA', value: s.iva },
                ]}
              />
              {s.otros !== '0.00' && (
                <p className="text-sm">
                  Otros tipos fiscales: {formatReportMoney(s.otros)}.
                </p>
              )}
              {tab === 'gerencial' && data.comparacion && (
                <div className="rounded-lg border bg-muted/40 p-4 text-sm">
                  <p>
                    Anterior ({data.comparacion.periodo.desde} al{' '}
                    {data.comparacion.periodo.hasta}):{' '}
                    <strong>
                      {formatReportMoney(data.comparacion.resumen.total)}
                    </strong>
                    {' · '}
                    Diferencia:{' '}
                    <strong>
                      {formatReportMoney(data.comparacion.diferencia)}
                    </strong>
                    {' · '}
                    Variación:{' '}
                    <strong>
                      {data.comparacion.porcentaje == null
                        ? '—'
                        : `${data.comparacion.porcentaje}%`}
                    </strong>
                  </p>
                </div>
              )}
              <ReportTable
                title="Evolución mensual"
                data={(data.meses || []).map((row) => ({
                  ...row,
                  ...displayResumen(row),
                }))}
                columns={totalsColumns}
                onRowClick={(r) =>
                  setDetail({ mes: r.id, label: `Comprobantes de ${r.nombre}` })
                }
              />
              <ReportTable
                title="Vendedores"
                data={(data.vendedores || []).map((row) => ({
                  ...row,
                  ...displayResumen(row),
                }))}
                columns={[
                  column('nombre', 'Vendedor'),
                  column('documentos', 'Documentos'),
                  column('total', 'Total', true),
                ]}
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
                    label: 'Neto de líneas',
                    value: data.productos_totales.neto,
                  },
                  {
                    label: 'IVA de líneas',
                    value: data.productos_totales.iva,
                  },
                  {
                    label: 'Total de líneas',
                    value: data.productos_totales.total_lineas,
                  },
                ]}
              />
              <ReportTable
                title="Productos y servicios"
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
                    label: 'Clientes únicos',
                    value: s.clientes,
                    raw: true,
                  },
                  { label: 'Documentos', value: s.documentos, raw: true },
                ]}
              />
              <ReportTable
                title="Ciudades"
                data={(data.ciudades || []).map((row) => ({
                  ...row,
                  ...displayResumen(row),
                }))}
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
            <PanelCard title="Consulta de líneas">
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
                  <option value="todos">Todos</option>
                  <option value="normal">Normal</option>
                  <option value="flete">Con flete</option>
                </select>
              </div>
              <p className="mb-3 text-sm">
                {filteredLines.length} líneas ·{' '}
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
                    label: 'Facturación',
                    value: s.total,
                    onClick: openAll,
                  },
                  {
                    label: 'Compras',
                    value: data.resultado.compras,
                  },
                  { label: 'Gastos', value: data.resultado.gastos },
                  {
                    label: 'Diferencia',
                    value: data.resultado.diferencia,
                  },
                ]}
              />
              <ReportTable
                title="Compras del período"
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
                  },
                ]}
              />
              <ReportTable
                title="Movimientos por cuenta"
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
              {selectedDocument && (
                <PanelCard
                  title={`${selectedDocument.numero} · ID ${selectedDocument.id}`}
                >
                  <p className="mb-3 text-sm">
                    Fecha: {selectedDocument.fecha_comercial} · Vendedor:{' '}
                    {selectedDocument.vendedor_emisor}
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
        </>
      )}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => router.push('/inicio')}>
          Volver al menú
        </Button>
        <Button variant="outline" onClick={reload} disabled={query.isFetching}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualizar
        </Button>
      </div>
    </main>
  );
}
