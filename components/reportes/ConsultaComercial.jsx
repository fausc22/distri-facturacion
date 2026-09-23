import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { axiosAuth } from '../../utils/apiClient';
import { useConsultaComercial } from '../../hooks/useConsultaComercial';
import { useReportesContext } from '../../context/ReportesContext';
import { MetricsCard, FinancialMetricsCard, MetricsGrid } from '../charts/MetricsCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PanelCard } from '@/components/shared/PanelCard';
import { LoadingState, EmptyState, ErrorState } from '@/components/shared/StateViews';

const POR_PAGINA = 50;

const ETIQUETA_DOC = {
  FACTURA: 'Factura',
  NOTA_DEBITO: 'Nota de débito',
  NOTA_CREDITO: 'Nota de crédito',
};

const formatearDia = (iso) => {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(String(iso))) return iso || '-';
  const [anio, mes, dia] = String(iso).slice(0, 10).split('-');
  return `${dia}/${mes}/${anio}`;
};

const formatearCantidad = (valor) => {
  const n = Number(valor || 0);
  return n.toLocaleString('es-AR', { maximumFractionDigits: 2 });
};

function BuscadorEntidad({ id, label, placeholder, seleccionado, onSeleccionar, onLimpiar, buscar }) {
  const [texto, setTexto] = useState(seleccionado?.nombre || '');
  const [opciones, setOpciones] = useState([]);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    setTexto(seleccionado?.nombre || '');
  }, [seleccionado]);

  useEffect(() => {
    if (!abierto) return undefined;
    const termino = texto.trim();
    if (termino.length < 2 || termino === seleccionado?.nombre) {
      setOpciones([]);
      return undefined;
    }
    let cancelado = false;
    const timer = setTimeout(async () => {
      try {
        const lista = await buscar(termino);
        if (!cancelado) setOpciones(lista);
      } catch {
        if (!cancelado) setOpciones([]);
      }
    }, 300);
    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [abierto, buscar, seleccionado?.nombre, texto]);

  return (
    <div className="relative space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={texto}
        placeholder={placeholder}
        autoComplete="off"
        onFocus={() => setAbierto(true)}
        onChange={(e) => {
          setTexto(e.target.value);
          setAbierto(true);
          if (seleccionado) onLimpiar();
        }}
      />
      {seleccionado && (
        <button type="button" className="text-xs text-muted-foreground underline" onClick={onLimpiar}>
          Quitar filtro
        </button>
      )}
      {abierto && opciones.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-md border bg-background shadow-md">
          {opciones.map((opcion) => (
            <li key={opcion.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={() => {
                  onSeleccionar(opcion);
                  setTexto(opcion.nombre);
                  setOpciones([]);
                  setAbierto(false);
                }}
              >
                {opcion.nombre}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ConsultaComercial() {
  const { formatCurrency } = useReportesContext();
  const [producto, setProducto] = useState(null);
  const [cliente, setCliente] = useState(null);
  const [vendedor, setVendedor] = useState('');
  const [empleados, setEmpleados] = useState([]);
  const [pagina, setPagina] = useState(1);

  const { data, loading, error, recargar, etiquetaPeriodo, rango } = useConsultaComercial({
    productoId: producto?.id,
    clienteId: cliente?.id,
    vendedor,
    pagina,
    porPagina: POR_PAGINA,
  });

  useEffect(() => {
    setPagina(1);
  }, [producto?.id, cliente?.id, vendedor, rango.desde, rango.hasta]);

  useEffect(() => {
    let cancelado = false;
    axiosAuth.get('/empleados/listar')
      .then((response) => {
        const lista = Array.isArray(response.data) ? response.data : (response.data?.data || []);
        if (!cancelado) setEmpleados(lista);
      })
      .catch(() => {
        if (!cancelado) setEmpleados([]);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  const buscarProductos = useCallback(async (termino) => {
    const response = await axiosAuth.get(
      `/productos/buscar-producto?search=${encodeURIComponent(termino)}&pagina=1&porPagina=8`
    );
    return (response.data?.data || []).map((item) => ({ id: item.id, nombre: item.nombre }));
  }, []);

  const buscarClientes = useCallback(async (termino) => {
    const params = new URLSearchParams({ search: termino, pagina: '1', porPagina: '8' });
    const response = await axiosAuth.get(`/personas/buscar-cliente?${params.toString()}`);
    return (response.data?.data || []).map((item) => ({ id: item.id, nombre: item.nombre }));
  }, []);

  const resumen = data?.resumen;
  const detalle = data?.detalle || [];
  const total = data?.paginacion?.total || 0;
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Consulta comercial</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ventas facturadas por producto, cliente o vendedor · {etiquetaPeriodo}
          </p>
        </div>
        <Button className="sm:mt-0" onClick={recargar} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      <PanelCard title="Filtros">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <BuscadorEntidad
            id="consulta-producto"
            label="Producto"
            placeholder="Buscar producto"
            seleccionado={producto}
            onSeleccionar={setProducto}
            onLimpiar={() => setProducto(null)}
            buscar={buscarProductos}
          />
          <BuscadorEntidad
            id="consulta-cliente"
            label="Cliente"
            placeholder="Buscar cliente"
            seleccionado={cliente}
            onSeleccionar={setCliente}
            onLimpiar={() => setCliente(null)}
            buscar={buscarClientes}
          />
          <div className="space-y-1">
            <Label htmlFor="consulta-vendedor">Vendedor</Label>
            <select
              id="consulta-vendedor"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={vendedor}
              onChange={(e) => setVendedor(e.target.value)}
            >
              <option value="">Todos</option>
              {empleados.map((empleado) => (
                <option key={empleado.id} value={empleado.nombre}>
                  {[empleado.nombre, empleado.apellido].filter(Boolean).join(' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </PanelCard>

      {error && !data ? (
        <ErrorState message={error} onRetry={recargar} />
      ) : (
        <>
          <MetricsGrid columns={3}>
            <MetricsCard
              title="Unidades"
              value={formatearCantidad(resumen?.unidades)}
              color="blue"
              loading={loading && !resumen}
            />
            <FinancialMetricsCard
              title="Importe neto"
              value={resumen?.importe_neto || 0}
              formatCurrency={formatCurrency}
              color="green"
              loading={loading && !resumen}
            />
            <MetricsCard
              title="Comprobantes"
              value={formatearCantidad(resumen?.comprobantes)}
              color="purple"
              loading={loading && !resumen}
            />
          </MetricsGrid>

          <PanelCard title="Detalle">
            {loading && detalle.length === 0 ? (
              <LoadingState message="Cargando ventas facturadas..." />
            ) : detalle.length === 0 ? (
              <EmptyState message="No hay ventas facturadas para esos filtros." />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase text-muted-foreground">
                      <th className="px-3 py-2">Fecha</th>
                      <th className="px-3 py-2">Comprobante</th>
                      <th className="px-3 py-2">Cliente</th>
                      <th className="px-3 py-2">Vendedor</th>
                      <th className="px-3 py-2">Producto</th>
                      <th className="px-3 py-2 text-right">Cantidad</th>
                      <th className="px-3 py-2 text-right">Importe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {detalle.map((fila, index) => (
                      <tr key={`${fila.numero_factura}-${fila.producto_nombre}-${index}`}>
                        <td className="px-3 py-2 whitespace-nowrap">{formatearDia(fila.fecha)}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {ETIQUETA_DOC[fila.tipo_doc] || fila.tipo_doc} {fila.numero_factura || ''}
                        </td>
                        <td className="px-3 py-2">{fila.cliente_nombre}</td>
                        <td className="px-3 py-2">{fila.empleado_nombre}</td>
                        <td className="px-3 py-2">{fila.producto_nombre}</td>
                        <td className="px-3 py-2 text-right">{formatearCantidad(fila.cantidad)}</td>
                        <td className="px-3 py-2 text-right">{formatCurrency(fila.importe)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {total > POR_PAGINA && (
              <div className="mt-4 flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">
                  Página {pagina} de {totalPaginas}
                </span>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" disabled={pagina <= 1 || loading} onClick={() => setPagina((p) => p - 1)}>
                    Anterior
                  </Button>
                  <Button type="button" variant="outline" size="sm" disabled={pagina >= totalPaginas || loading} onClick={() => setPagina((p) => p + 1)}>
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </PanelCard>
        </>
      )}
    </div>
  );
}

export default ConsultaComercial;
