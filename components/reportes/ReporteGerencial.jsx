import { useMemo } from 'react';
import useAuth from '../../hooks/useAuth';
import { useReporteGerencial } from '../../hooks/useReporteGerencial';

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

function SelectorPeriodo({
  modo, setModo,
  seleccionMes, setSeleccionMes,
  seleccionRango, setSeleccionRango,
  meses, aniosDisponibles,
  etiquetaPeriodo,
  onRecargar, loading
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="text-sm text-gray-500">Periodo del reporte</div>
          <div className="text-base font-semibold text-gray-900">{etiquetaPeriodo}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setModo('mes')}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
              modo === 'mes'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Mes especifico
          </button>
          <button
            type="button"
            onClick={() => setModo('rango')}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
              modo === 'rango'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Rango de meses
          </button>
          <button
            type="button"
            onClick={onRecargar}
            disabled={loading}
            className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? 'Cargando...' : 'Recargar'}
          </button>
        </div>
      </div>

      <div className="p-4">
        {modo === 'mes' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mes</label>
              <select
                value={seleccionMes.mes}
                onChange={(e) => setSeleccionMes({ ...seleccionMes, mes: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {meses.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
              <select
                value={seleccionMes.anio}
                onChange={(e) => setSeleccionMes({ ...seleccionMes, anio: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {aniosDisponibles.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-xs uppercase font-semibold text-gray-500 tracking-wide">
              Filtro especial: rango entre meses
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Desde - mes</label>
                  <select
                    value={seleccionRango.desdeMes}
                    onChange={(e) => setSeleccionRango({ ...seleccionRango, desdeMes: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {meses.map(m => (<option key={m.value} value={m.value}>{m.label}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
                  <select
                    value={seleccionRango.desdeAnio}
                    onChange={(e) => setSeleccionRango({ ...seleccionRango, desdeAnio: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {aniosDisponibles.map(y => (<option key={y} value={y}>{y}</option>))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hasta - mes</label>
                  <select
                    value={seleccionRango.hastaMes}
                    onChange={(e) => setSeleccionRango({ ...seleccionRango, hastaMes: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {meses.map(m => (<option key={m.value} value={m.value}>{m.label}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
                  <select
                    value={seleccionRango.hastaAnio}
                    onChange={(e) => setSeleccionRango({ ...seleccionRango, hastaAnio: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {aniosDisponibles.map(y => (<option key={y} value={y}>{y}</option>))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CardResumen({ titulo, valor, subtitulo, color = 'gray' }) {
  const colorMap = {
    green: 'bg-green-50 border-green-200 text-green-800',
    blue:  'bg-blue-50 border-blue-200 text-blue-800',
    amber: 'bg-amber-50 border-amber-200 text-amber-800',
    gray:  'bg-gray-50 border-gray-200 text-gray-800'
  };
  return (
    <div className={`rounded-lg border p-4 ${colorMap[color] || colorMap.gray}`}>
      <div className="text-xs uppercase tracking-wide font-semibold opacity-70">{titulo}</div>
      <div className="mt-1 text-xl font-bold">{valor}</div>
      {subtitulo && (
        <div className="mt-1 text-xs opacity-70 truncate" title={subtitulo}>{subtitulo}</div>
      )}
    </div>
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
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">{titulo}</h3>
      </div>
      {vacio ? (
        <div className="p-6 text-center text-sm text-gray-500 italic">Sin datos para el periodo seleccionado</div>
      ) : (
        <div className="overflow-x-auto">
          {children}
        </div>
      )}
    </div>
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
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-6 bg-gray-100 rounded" />
      ))}
    </div>
  );
}

/* ---------- Componente principal ---------- */

export function ReporteGerencial() {
  const { user } = useAuth();
  const esGerente = user?.rol === 'GERENTE';

  const {
    modo, setModo,
    seleccionMes, setSeleccionMes,
    seleccionRango, setSeleccionRango,
    rango,
    datos, loading, error,
    generandoPDF, descargarPDF, recargar,
    aniosDisponibles, meses, etiquetaPeriodo
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
          <h2 className="text-2xl font-bold text-gray-900">Reporte Gerencial</h2>
          <p className="text-sm text-gray-500 mt-1">
            Datos clave del periodo: {etiquetaPeriodo}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Rango efectivo: {rango.desde} al {rango.hasta}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {esGerente && (
            <button
              onClick={descargarPDF}
              disabled={generandoPDF || loading || !datos}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className={`w-4 h-4 ${generandoPDF ? 'animate-pulse' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>{generandoPDF ? 'Generando PDF...' : 'Descargar PDF gerencial'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Selector de periodo */}
      <SelectorPeriodo
        modo={modo} setModo={setModo}
        seleccionMes={seleccionMes} setSeleccionMes={setSeleccionMes}
        seleccionRango={seleccionRango} setSeleccionRango={setSeleccionRango}
        meses={meses} aniosDisponibles={aniosDisponibles}
        etiquetaPeriodo={etiquetaPeriodo}
        onRecargar={recargar}
        loading={loading}
      />

      {/* Error */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Estado vacio */}
      {!loading && datos && sinDatos && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <div className="text-amber-800 font-semibold">No hay ventas registradas para este periodo</div>
          <div className="text-sm text-amber-700 mt-1">Probá con otro mes u otro rango.</div>
        </div>
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
