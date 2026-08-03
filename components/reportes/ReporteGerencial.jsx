import { useMemo } from 'react';
import { FileDown } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { useReporteGerencial } from '../../hooks/useReporteGerencial';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PanelCard } from '@/components/shared/PanelCard';
import { LoadingState, EmptyState, ErrorState } from '@/components/shared/StateViews';
import { cn } from '@/lib/utils';

/* ---------- Helpers de formato ---------- */
const formatMoney = (valor) => {
  const n = Number(valor || 0);
  return n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatNumero = (valor) => Number(valor || 0).toLocaleString('es-AR');

const formatCantidad = (valor) => {
  const n = Number(valor || 0);
  if (n % 1 === 0) return n.toLocaleString('es-AR');
  return n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const MESES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const formatearMesYYYYMM = (yyyymm) => {
  if (!yyyymm) return '-';
  const [y, m] = String(yyyymm).split('-');
  const mIdx = parseInt(m, 10) - 1;
  if (!y || isNaN(mIdx) || mIdx < 0 || mIdx > 11) return yyyymm;
  return `${MESES_ES[mIdx]} ${y}`;
};

const formatearFecha = (fecha) => {
  if (!fecha) return '-';
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

/* ---------- Subcomponentes ---------- */

function CardResumen({ titulo, valor, subtitulo, color = 'gray' }) {
  const colorMap = {
    green: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    blue: 'border-blue-200 bg-blue-50 text-blue-800',
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
    gray: 'border-border bg-muted/30 text-foreground',
  };
  return (
    <Card className={cn('p-4', colorMap[color] || colorMap.gray)}>
      <div className="text-xs font-semibold uppercase tracking-wide opacity-70">{titulo}</div>
      <div className="mt-1 text-xl font-bold">{valor}</div>
      {subtitulo && (
        <div className="mt-1 truncate text-xs opacity-70" title={subtitulo}>{subtitulo}</div>
      )}
    </Card>
  );
}

function ResumenEjecutivo({ datos }) {
  const r = datos?.resumen || {};
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      <CardResumen
        titulo="Facturacion (sin fletes)"
        valor={`$ ${formatMoney(r.total_facturado_sin_fletes)}`}
        color="green"
      />
      <CardResumen
        titulo="Ventas (sin fletes)"
        valor={formatNumero(r.cantidad_ventas_sin_fletes)}
        color="blue"
      />
      <CardResumen
        titulo="Ticket promedio"
        valor={`$ ${formatMoney(r.ticket_promedio_sin_fletes)}`}
        color="amber"
      />
      <CardResumen
        titulo="Facturacion total"
        valor={`$ ${formatMoney(r.total_facturado_global)}`}
        subtitulo="incluye ventas con flete"
        color="gray"
      />
      <CardResumen
        titulo="Mejor mes"
        valor={r.mejor_mes ? formatearMesYYYYMM(r.mejor_mes.mes) : '-'}
        subtitulo={r.mejor_mes ? `$ ${formatMoney(r.mejor_mes.total_facturado)} - ${formatNumero(r.mejor_mes.cantidad_ventas)} ventas` : ''}
        color="gray"
      />
      <CardResumen
        titulo="Mejor vendedor"
        valor={r.mejor_vendedor?.vendedor || '-'}
        subtitulo={r.mejor_vendedor ? `$ ${formatMoney(r.mejor_vendedor.total_vendido)}` : ''}
        color="gray"
      />
      <CardResumen
        titulo="Producto estrella"
        valor={r.producto_estrella?.producto_nombre || '-'}
        subtitulo={r.producto_estrella ? `${formatCantidad(r.producto_estrella.total_cantidad)} unidades` : ''}
        color="gray"
      />
      <CardResumen
        titulo="Ciudad top"
        valor={r.ciudad_top?.ciudad || '-'}
        subtitulo={r.ciudad_top ? `${formatNumero(r.ciudad_top.cantidad_ventas)} ventas` : ''}
        color="gray"
      />
    </div>
  );
}

function TablaWrapper({ titulo, children, vacio }) {
  return (
    <PanelCard title={titulo}>
      {vacio ? (
        <EmptyState message="Sin datos para el periodo seleccionado" />
      ) : (
        <div className="overflow-x-auto">{children}</div>
      )}
    </PanelCard>
  );
}

function TablaVentasPorMes({ datos }) {
  const filas = datos?.ventas_por_mes || [];
  const totalVentas = filas.reduce((acc, r) => acc + Number(r.cantidad_ventas || 0), 0);
  const totalFacturado = filas.reduce((acc, r) => acc + Number(r.total_facturado || 0), 0);

  return (
    <TablaWrapper titulo="Ventas por mes (excluye ventas con flete)" vacio={filas.length === 0}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Mes</th>
            <th className="px-4 py-2 text-center text-xs font-bold text-gray-700 uppercase">Cant. ventas</th>
            <th className="px-4 py-2 text-right text-xs font-bold text-gray-700 uppercase">Total facturado</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {filas.map((r) => (
            <tr key={r.mes} className="hover:bg-gray-50">
              <td className="px-4 py-2 text-sm font-medium text-gray-900">{formatearMesYYYYMM(r.mes)}</td>
              <td className="px-4 py-2 text-sm text-center text-gray-900">{formatNumero(r.cantidad_ventas)}</td>
              <td className="px-4 py-2 text-sm text-right font-semibold text-green-700">$ {formatMoney(r.total_facturado)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-900 text-white">
            <td className="px-4 py-2 text-sm font-bold">TOTAL</td>
            <td className="px-4 py-2 text-sm text-center font-bold">{formatNumero(totalVentas)}</td>
            <td className="px-4 py-2 text-sm text-right font-bold">$ {formatMoney(totalFacturado)}</td>
          </tr>
        </tfoot>
      </table>
    </TablaWrapper>
  );
}

function TablaTopProductos({ datos }) {
  const filas = datos?.top_productos || [];
  return (
    <TablaWrapper titulo="Top 10 productos por cantidad vendida (sin fletes)" vacio={filas.length === 0}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-3 py-2 text-center text-xs font-bold text-gray-700 uppercase w-10">#</th>
            <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Producto</th>
            <th className="px-4 py-2 text-center text-xs font-bold text-gray-700 uppercase">Cant. total</th>
            <th className="px-4 py-2 text-right text-xs font-bold text-gray-700 uppercase">Ingresos</th>
            <th className="px-4 py-2 text-center text-xs font-bold text-gray-700 uppercase">En cuantas ventas</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {filas.map((r, idx) => (
            <tr key={`${r.producto_nombre}-${idx}`} className="hover:bg-gray-50">
              <td className="px-3 py-2 text-sm text-center font-bold text-gray-700">{idx + 1}</td>
              <td className="px-4 py-2 text-sm text-gray-900">{r.producto_nombre}</td>
              <td className="px-4 py-2 text-sm text-center font-semibold text-blue-700">{formatCantidad(r.total_cantidad)}</td>
              <td className="px-4 py-2 text-sm text-right text-green-700 font-medium">$ {formatMoney(r.total_ingresos)}</td>
              <td className="px-4 py-2 text-sm text-center text-gray-700">{formatNumero(r.en_cuantas_ventas)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TablaWrapper>
  );
}

function TablaTopCiudades({ datos }) {
  const filas = datos?.top_ciudades || [];
  return (
    <TablaWrapper titulo="Top 10 ciudades por cantidad de ventas" vacio={filas.length === 0}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-3 py-2 text-center text-xs font-bold text-gray-700 uppercase w-10">#</th>
            <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Ciudad</th>
            <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Provincia</th>
            <th className="px-4 py-2 text-center text-xs font-bold text-gray-700 uppercase">Cant. ventas</th>
            <th className="px-4 py-2 text-center text-xs font-bold text-gray-700 uppercase">Clientes</th>
            <th className="px-4 py-2 text-right text-xs font-bold text-gray-700 uppercase">Total facturado</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {filas.map((r, idx) => (
            <tr key={`${r.ciudad}-${r.provincia}-${idx}`} className="hover:bg-gray-50">
              <td className="px-3 py-2 text-sm text-center font-bold text-gray-700">{idx + 1}</td>
              <td className="px-4 py-2 text-sm text-gray-900">{r.ciudad}</td>
              <td className="px-4 py-2 text-sm text-gray-600">{r.provincia || '-'}</td>
              <td className="px-4 py-2 text-sm text-center font-semibold text-blue-700">{formatNumero(r.cantidad_ventas)}</td>
              <td className="px-4 py-2 text-sm text-center text-gray-700">{formatNumero(r.clientes_unicos)}</td>
              <td className="px-4 py-2 text-sm text-right text-green-700 font-medium">$ {formatMoney(r.total_facturado)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TablaWrapper>
  );
}

function TablaVendedores({ datos }) {
  const filas = datos?.vendedores || [];
  const totalVentas = filas.reduce((acc, r) => acc + Number(r.cantidad_ventas || 0), 0);
  const totalVendido = filas.reduce((acc, r) => acc + Number(r.total_vendido || 0), 0);
  return (
    <TablaWrapper titulo="Rendimiento por vendedor" vacio={filas.length === 0}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Vendedor</th>
            <th className="px-4 py-2 text-center text-xs font-bold text-gray-700 uppercase">Cant. ventas</th>
            <th className="px-4 py-2 text-right text-xs font-bold text-gray-700 uppercase">Total vendido</th>
            <th className="px-4 py-2 text-right text-xs font-bold text-gray-700 uppercase">Ticket prom.</th>
            <th className="px-4 py-2 text-center text-xs font-bold text-gray-700 uppercase whitespace-nowrap">Primera</th>
            <th className="px-4 py-2 text-center text-xs font-bold text-gray-700 uppercase whitespace-nowrap">Ultima</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {filas.map((r, idx) => (
            <tr key={`${r.vendedor}-${idx}`} className="hover:bg-gray-50">
              <td className="px-4 py-2 text-sm font-medium text-gray-900">{r.vendedor}</td>
              <td className="px-4 py-2 text-sm text-center text-gray-900">{formatNumero(r.cantidad_ventas)}</td>
              <td className="px-4 py-2 text-sm text-right font-semibold text-green-700">$ {formatMoney(r.total_vendido)}</td>
              <td className="px-4 py-2 text-sm text-right text-gray-700">$ {formatMoney(r.ticket_promedio)}</td>
              <td className="px-4 py-2 text-sm text-center text-gray-600 whitespace-nowrap">{formatearFecha(r.primera_venta)}</td>
              <td className="px-4 py-2 text-sm text-center text-gray-600 whitespace-nowrap">{formatearFecha(r.ultima_venta)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-900 text-white">
            <td className="px-4 py-2 text-sm font-bold">TOTAL</td>
            <td className="px-4 py-2 text-sm text-center font-bold">{formatNumero(totalVentas)}</td>
            <td className="px-4 py-2 text-sm text-right font-bold">$ {formatMoney(totalVendido)}</td>
            <td colSpan={3} />
          </tr>
        </tfoot>
      </table>
    </TablaWrapper>
  );
}

function SkeletonTabla() {
  return <LoadingState message="Cargando reporte gerencial..." />;
}

/* ---------- Componente principal ---------- */

export function ReporteGerencial() {
  const { user } = useAuth();
  const esGerente = user?.rol === 'GERENTE';

  const {
    rango,
    datos, loading, error,
    generandoPDF, descargarPDF, recargar,
    etiquetaPeriodo
  } = useReporteGerencial();

  const sinDatos = useMemo(() => {
    if (!datos) return false;
    return (
      (datos.ventas_por_mes?.length || 0) === 0 &&
      (datos.top_productos?.length || 0) === 0 &&
      (datos.top_ciudades?.length || 0) === 0 &&
      (datos.vendedores?.length || 0) === 0
    );
  }, [datos]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Reporte Gerencial</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Datos clave del periodo: {etiquetaPeriodo}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Rango efectivo: {rango.desde} al {rango.hasta}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {esGerente && (
            <Button
              variant="danger"
              onClick={descargarPDF}
              disabled={generandoPDF || loading || !datos}
            >
              <FileDown className={`mr-2 h-4 w-4 ${generandoPDF ? 'animate-pulse' : ''}`} />
              {generandoPDF ? 'Generando PDF...' : 'Descargar PDF gerencial'}
            </Button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && !loading && <ErrorState message={error} onRetry={recargar} />}

      {!loading && datos && sinDatos && (
        <EmptyState message="No hay ventas registradas para este periodo. Probá con otro mes u otro rango." />
      )}

      {/* Resumen ejecutivo */}
      {datos && !sinDatos && <ResumenEjecutivo datos={datos} />}

      {/* Tablas */}
      {loading && !datos ? (
        <div className="space-y-4">
          <SkeletonTabla />
          <SkeletonTabla />
          <SkeletonTabla />
          <SkeletonTabla />
        </div>
      ) : datos && !sinDatos ? (
        <div className="space-y-5">
          <TablaVentasPorMes datos={datos} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <TablaTopProductos datos={datos} />
            <TablaTopCiudades datos={datos} />
          </div>
          <TablaVendedores datos={datos} />
        </div>
      ) : null}
    </div>
  );
}

export default ReporteGerencial;
