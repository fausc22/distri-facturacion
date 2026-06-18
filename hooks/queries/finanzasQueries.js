import { useQuery, useMutation } from '@tanstack/react-query';
import { axiosAuth } from '@/utils/apiClient';
import { queryKeys } from './queryKeys';

function buildIngresosParams(filtros, paginacion) {
  const params = new URLSearchParams({
    limit: paginacion.registrosPorPagina,
    page: paginacion.paginaActual,
  });
  if (filtros.desde) params.append('desde', filtros.desde);
  if (filtros.hasta) params.append('hasta', filtros.hasta);
  if (filtros.tipo !== 'todos') params.append('tipo', filtros.tipo);
  if (filtros.cuenta !== 'todas') params.append('cuenta', filtros.cuenta);
  if (filtros.busqueda) params.append('busqueda', filtros.busqueda);
  return params.toString();
}

export function useIngresosHistorialQuery(filtros, paginacion, enabled = true) {
  const queryParams = { filtros, paginacion };
  return useQuery({
    queryKey: queryKeys.ingresos.historial(queryParams),
    enabled,
    queryFn: async () => {
      const qs = buildIngresosParams(filtros, paginacion);
      const response = await axiosAuth.get(`/finanzas/ingresos/historial?${qs}`);
      if (!response.data?.success) {
        throw new Error('Error al cargar ingresos');
      }
      return {
        ingresos: response.data.data ?? [],
        total: response.data.total ?? 0,
        count: response.data.count ?? response.data.data?.length ?? 0,
      };
    },
  });
}

export function useIngresosCuentasQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.ingresos.cuentas,
    enabled,
    queryFn: async () => {
      const response = await axiosAuth.get('/finanzas/ingresos/cuentas');
      return response.data?.data ?? response.data ?? [];
    },
  });
}

function buildEgresosParams(filtros, paginacion) {
  const params = new URLSearchParams({
    limit: paginacion.registrosPorPagina,
    page: paginacion.paginaActual,
  });
  if (filtros.desde) params.append('desde', filtros.desde);
  if (filtros.hasta) params.append('hasta', filtros.hasta);
  if (filtros.tipo !== 'todos') params.append('tipo', filtros.tipo);
  if (filtros.cuenta !== 'todas') params.append('cuenta', filtros.cuenta);
  if (filtros.busqueda) params.append('busqueda', filtros.busqueda);
  return params.toString();
}

export function useEgresosHistorialQuery(filtros, paginacion, enabled = true) {
  const queryParams = { filtros, paginacion };
  return useQuery({
    queryKey: queryKeys.egresos.historial(queryParams),
    enabled,
    queryFn: async () => {
      const qs = buildEgresosParams(filtros, paginacion);
      const response = await axiosAuth.get(`/finanzas/egresos/historial?${qs}`);
      if (!response.data?.success) {
        throw new Error('Error al cargar egresos');
      }
      return {
        egresos: response.data.data ?? [],
        total: response.data.total ?? 0,
        count: response.data.count ?? response.data.data?.length ?? 0,
      };
    },
  });
}

export function useEgresosCuentasQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.egresos.cuentas,
    enabled,
    queryFn: async () => {
      const response = await axiosAuth.get('/finanzas/egresos/cuentas');
      return response.data?.data ?? response.data ?? [];
    },
  });
}

const trim = (v) => (typeof v === 'string' ? v.trim() : v);

const trimPedidos = (v) => (typeof v === 'string' ? v.trim() : v);

function buildPedidosParams({ pagina, porPagina, filtros, empleadoId, usarSoloRecientes }) {
  const params = new URLSearchParams();
  params.set('pagina', String(pagina));
  params.set('porPagina', String(porPagina));
  if (empleadoId) params.set('empleado_id', empleadoId);
  if (trimPedidos(filtros?.fechaDesde)) params.set('fechaDesde', trimPedidos(filtros.fechaDesde));
  if (trimPedidos(filtros?.fechaHasta)) params.set('fechaHasta', trimPedidos(filtros.fechaHasta));
  if (trimPedidos(filtros?.cliente)) params.set('cliente', trimPedidos(filtros.cliente));
  if (trimPedidos(filtros?.estado)) params.set('estado', trimPedidos(filtros.estado));
  if (trimPedidos(filtros?.ciudad)) params.set('ciudad', trimPedidos(filtros.ciudad));
  if (trimPedidos(filtros?.empleado)) params.set('empleado_nombre', trimPedidos(filtros.empleado));
  if (usarSoloRecientes) params.set('dias', '30');
  return params.toString();
}

export function usePedidosHistorialQuery(queryParams, enabled = true) {
  return useQuery({
    queryKey: queryKeys.pedidos.historial(queryParams),
    enabled,
    queryFn: async () => {
      const qs = buildPedidosParams(queryParams);
      const response = await axiosAuth.get(`/pedidos/obtener-pedidos?${qs}`);
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Error al cargar pedidos');
      }
      return {
        pedidos: response.data.data ?? [],
        total: response.data.total ?? 0,
        pagina: response.data.pagina ?? queryParams.pagina,
        porPagina: response.data.porPagina ?? queryParams.porPagina,
      };
    },
  });
}

export function useVentasHistorialQuery({ pagina, porPagina, filtros }, enabled = true) {
  const queryParams = { pagina, porPagina, filtros };
  return useQuery({
    queryKey: queryKeys.ventas.historial(queryParams),
    enabled,
    queryFn: async () => {
      const params = { pagina, porPagina };
      if (trim(filtros?.cliente)) params.cliente = trim(filtros.cliente);
      if (trim(filtros?.ciudad)) params.ciudad = trim(filtros.ciudad);
      if (trim(filtros?.fechaDesde)) params.fechaDesde = trim(filtros.fechaDesde);
      if (trim(filtros?.fechaHasta)) params.fechaHasta = trim(filtros.fechaHasta);
      if (trim(filtros?.tipoDocumento)) params.tipoDocumento = trim(filtros.tipoDocumento);
      if (trim(filtros?.tipoFiscal)) params.tipoFiscal = trim(filtros.tipoFiscal);
      if (trim(filtros?.empleado)) params.empleado = trim(filtros.empleado);

      const response = await axiosAuth.get('/ventas/obtener-ventas', { params });
      if (!response.data?.success) {
        return { ventas: [], total: 0, pagina, porPagina };
      }
      return {
        ventas: response.data.data ?? [],
        total: response.data.total ?? 0,
        pagina: response.data.pagina ?? pagina,
        porPagina: response.data.porPagina ?? porPagina,
      };
    },
  });
}

export function useListadosCategoriasQuery() {
  return useQuery({
    queryKey: queryKeys.listados.categorias,
    queryFn: async () => {
      const response = await axiosAuth.get('/productos/categorias');
      return response.data.data ?? response.data ?? [];
    },
  });
}

export function useListadosEmpleadosQuery() {
  return useQuery({
    queryKey: queryKeys.listados.empleados,
    queryFn: async () => {
      const response = await axiosAuth.get('/empleados/listar-todos');
      const empleados = response.data?.data ?? response.data ?? [];
      if (!Array.isArray(empleados)) return [];
      return empleados.filter((emp) => emp.activo === 1);
    },
  });
}

function buildMovimientosParams(filtros) {
  const params = new URLSearchParams();
  if (filtros.cuenta_id && filtros.cuenta_id !== 'todas') {
    params.append('cuenta_id', filtros.cuenta_id);
  }
  if (filtros.tipo && filtros.tipo !== 'todos') {
    params.append('tipo', filtros.tipo);
  }
  if (filtros.desde) params.append('desde', filtros.desde);
  if (filtros.hasta) params.append('hasta', filtros.hasta);
  if (filtros.busqueda) params.append('busqueda', filtros.busqueda);
  return params.toString();
}

export function useFondosCuentasQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.fondos.cuentas,
    enabled,
    queryFn: async () => {
      const response = await axiosAuth.get('/finanzas/obtener-cuentas');
      if (!response.data?.success) throw new Error('Error al cargar cuentas');
      return response.data.data ?? [];
    },
  });
}

export function useFondosMovimientosQuery(filtros, enabled = true) {
  return useQuery({
    queryKey: queryKeys.fondos.movimientos(filtros),
    enabled,
    queryFn: async () => {
      const qs = buildMovimientosParams(filtros);
      const response = await axiosAuth.get(`/finanzas/movimientos?${qs}`);
      if (!response.data?.success) throw new Error('Error al cargar movimientos');
      return response.data.data ?? [];
    },
  });
}

export function useCrearCuentaMutation() {
  return useMutation({
    mutationFn: async (formData) => {
      const response = await axiosAuth.post('/finanzas/cuentas', formData);
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Error al crear cuenta');
      }
      return response.data;
    },
  });
}

export function useRegistrarMovimientoMutation() {
  return useMutation({
    mutationFn: async (formData) => {
      const response = await axiosAuth.post('/finanzas/movimientos', formData);
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Error al registrar movimiento');
      }
      return response.data;
    },
  });
}

export function useTransferenciaMutation() {
  return useMutation({
    mutationFn: async (formData) => {
      const response = await axiosAuth.post('/finanzas/transferencias', formData);
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Error al transferir');
      }
      return response.data;
    },
  });
}

export function useComprasHistorialQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.compras.list,
    enabled,
    queryFn: async () => {
      const response = await axiosAuth.get('/compras/obtener-compras');
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Error al cargar compras');
      }
      return response.data.data ?? [];
    },
  });
}

export function useGastosHistorialQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.compras.gastos,
    enabled,
    queryFn: async () => {
      const response = await axiosAuth.get('/compras/obtener-gastos');
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Error al cargar gastos');
      }
      return response.data.data ?? [];
    },
  });
}

export function useProductosCompraQuery(compraId, enabled = true) {
  return useQuery({
    queryKey: queryKeys.compras.productos(compraId),
    enabled: enabled && !!compraId,
    queryFn: async () => {
      const response = await axiosAuth.get(`/compras/obtener-productos-compra/${compraId}`);
      const data = response.data;
      const productos = Array.isArray(data) ? data : data?.data ?? [];
      return productos.map((producto) => ({
        ...producto,
        precio_costo: parseFloat(producto.precio_costo) || 0,
        precio_venta: parseFloat(producto.precio_venta) || 0,
        subtotal: parseFloat(producto.subtotal) || 0,
        cantidad: parseFloat(producto.cantidad) || 0,
      }));
    },
  });
}

export function useRegistrarCompraMutation() {
  return useMutation({
    mutationFn: async (compraData) => {
      const response = await axiosAuth.post('/compras/registrarCompra', compraData);
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Error al registrar la compra');
      }
      return response.data;
    },
  });
}

export function useRegistrarGastoMutation() {
  return useMutation({
    mutationFn: async (gastoData) => {
      const response = await axiosAuth.post('/compras/nuevo-gasto', gastoData);
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Error al registrar el gasto');
      }
      return response.data;
    },
  });
}

// ─── Reportes: fetchers extraídos de useFinanzasData ───

export function appendFiltrosComunes(params, filtros = {}, incluirPeriodo = false) {
  if (filtros.desde) params.append('desde', filtros.desde);
  if (filtros.hasta) params.append('hasta', filtros.hasta);
  if (filtros.cuenta_id) params.append('cuenta_id', filtros.cuenta_id);
  if (filtros.tipo_fiscal) params.append('tipo_fiscal', filtros.tipo_fiscal);
  if (filtros.empleado_id) params.append('empleado_id', filtros.empleado_id);
  if (filtros.ciudad) params.append('ciudad', filtros.ciudad);
  if (filtros.cliente_id) params.append('cliente_id', filtros.cliente_id);
  if (filtros.limite) params.append('limite', filtros.limite);
  if (incluirPeriodo && filtros.periodo) params.append('periodo', filtros.periodo);
  if (filtros.comparativo) params.append('comparativo', filtros.comparativo);
}

function buildReportesParams(filtros = {}, incluirPeriodo = false) {
  const params = new URLSearchParams();
  appendFiltrosComunes(params, filtros, incluirPeriodo);
  return params;
}

export async function fetchDashboardSimplificado(filtros = {}) {
  const params = buildReportesParams(filtros);
  const response = await axiosAuth.get(`/finanzas/dashboard-simplificado?${params.toString()}`);
  if (!response.data?.success) throw new Error(response.data?.message || 'Error al cargar dashboard');
  return response.data.data ?? {};
}

export async function fetchGananciasDetalladas(filtros = {}) {
  if (!filtros.desde || !filtros.hasta) {
    throw new Error('Las fechas desde y hasta son obligatorias');
  }
  const params = buildReportesParams(filtros, true);
  if (!params.get('periodo')) params.append('periodo', 'mensual');
  const response = await axiosAuth.get(`/finanzas/ganancias-detalladas?${params.toString()}`);
  if (!response.data?.success) throw new Error(response.data?.message || 'Error al cargar ganancias');
  return {
    data: response.data.data ?? [],
    totales: response.data.totales ?? {},
    periodo: response.data.periodo,
  };
}

export async function fetchGananciasPorEmpleado(filtros = {}) {
  const params = buildReportesParams(filtros);
  const response = await axiosAuth.get(`/finanzas/ganancias-por-empleado?${params.toString()}`);
  if (!response.data?.success) throw new Error(response.data?.message || 'Error al cargar empleados');
  return response.data.data ?? [];
}

export async function fetchGananciasPorProducto(filtros = {}) {
  const params = buildReportesParams(filtros);
  const response = await axiosAuth.get(`/finanzas/ganancias-por-producto?${params.toString()}`);
  if (!response.data?.success) throw new Error(response.data?.message || 'Error al cargar productos');
  return response.data.data ?? [];
}

export async function fetchGananciasPorCiudad(filtros = {}) {
  const params = buildReportesParams(filtros);
  const response = await axiosAuth.get(`/finanzas/ganancias-por-ciudad?${params.toString()}`);
  if (!response.data?.success) throw new Error(response.data?.message || 'Error al cargar ciudades');
  return response.data.data ?? [];
}

export async function fetchResumenFinanciero(filtros = {}) {
  const params = buildReportesParams(filtros);
  const response = await axiosAuth.get(`/finanzas/resumen-financiero?${params.toString()}`);
  if (!response.data?.success) throw new Error(response.data?.message || 'Error al cargar resumen');
  return response.data.data;
}

export async function fetchBalanceGeneral(filtros = {}) {
  const params = buildReportesParams(filtros);
  if (filtros.anio) params.append('anio', filtros.anio);
  const response = await axiosAuth.get(`/finanzas/balance-general?${params.toString()}`);
  if (!response.data?.success) throw new Error(response.data?.message || 'Error al cargar balance');
  return { data: response.data.data ?? [], totales: response.data.totales ?? {} };
}

export async function fetchBalancePorCuenta(filtros = {}) {
  const params = buildReportesParams(filtros);
  const response = await axiosAuth.get(`/finanzas/balance-cuenta?${params.toString()}`);
  if (!response.data?.success) throw new Error(response.data?.message || 'Error al cargar balance por cuenta');
  return response.data.data ?? [];
}

export async function fetchFlujoDeFondos(filtros = {}) {
  const params = buildReportesParams(filtros);
  const response = await axiosAuth.get(`/finanzas/flujo-fondos?${params.toString()}`);
  if (!response.data?.success) throw new Error(response.data?.message || 'Error al cargar flujo de fondos');
  return { data: response.data.data ?? [], totales: response.data.totales ?? {} };
}

export async function fetchTopProductosTabla(filtros = {}) {
  const params = buildReportesParams(filtros);
  const response = await axiosAuth.get(`/finanzas/top-productos-tabla?${params.toString()}`);
  if (!response.data?.success) throw new Error(response.data?.message || 'Error al cargar top productos');
  return response.data.data ?? [];
}

export async function fetchProductosMasVendidos(filtros = {}) {
  const params = buildReportesParams(filtros);
  const response = await axiosAuth.get(`/finanzas/ventas-productos?${params.toString()}`);
  if (!response.data?.success) throw new Error(response.data?.message || 'Error al cargar productos vendidos');
  return response.data.data ?? [];
}

export async function fetchProductosMasRentables(filtros = {}) {
  const params = buildReportesParams(filtros);
  const response = await axiosAuth.get(`/finanzas/productos-mas-rentables?${params.toString()}`);
  if (!response.data?.success) throw new Error(response.data?.message || 'Error al cargar productos rentables');
  return response.data.data ?? [];
}

export async function fetchVentasPorVendedor(filtros = {}) {
  const params = buildReportesParams(filtros);
  const response = await axiosAuth.get(`/finanzas/ventas-vendedores?${params.toString()}`);
  if (!response.data?.success) throw new Error(response.data?.message || 'Error al cargar ventas por vendedor');
  return response.data.data ?? [];
}

export async function fetchAniosDisponibles() {
  const response = await axiosAuth.get('/finanzas/anios-disponibles');
  if (!response.data?.success) throw new Error(response.data?.message || 'Error al cargar años');
  return response.data.data ?? [];
}

export function useReportesDashboardQuery(filtros, enabled = true) {
  return useQuery({
    queryKey: queryKeys.reportes.dashboard(filtros),
    enabled: enabled && Boolean(filtros?.desde && filtros?.hasta),
    queryFn: () => fetchDashboardSimplificado(filtros),
  });
}

export function useReportesVentasQuery(filtros, enabled = true) {
  return useQuery({
    queryKey: queryKeys.reportes.ventas(filtros),
    enabled: enabled && Boolean(filtros?.desde && filtros?.hasta),
    queryFn: () => fetchGananciasDetalladas(filtros),
  });
}

export function useReportesBalanceQuery(filtros, enabled = true) {
  return useQuery({
    queryKey: queryKeys.reportes.balance(filtros),
    enabled: enabled && Boolean(filtros?.desde && filtros?.hasta),
    queryFn: async () => {
      const [balance, cuentas, flujo] = await Promise.all([
        fetchBalanceGeneral(filtros),
        fetchBalancePorCuenta(filtros),
        fetchFlujoDeFondos(filtros),
      ]);
      return { balance, cuentas, flujo };
    },
  });
}

export function useReportesProductosQuery(filtros, enabled = true) {
  return useQuery({
    queryKey: queryKeys.reportes.productos(filtros),
    enabled: enabled && Boolean(filtros?.desde && filtros?.hasta),
    queryFn: async () => {
      const [rentables, vendidos, ganancias] = await Promise.all([
        fetchProductosMasRentables(filtros),
        fetchProductosMasVendidos(filtros),
        fetchGananciasPorProducto(filtros),
      ]);
      return { rentables, vendidos, ganancias };
    },
  });
}

export function useReportesGeograficoQuery(filtros, enabled = true) {
  return useQuery({
    queryKey: queryKeys.reportes.geografico(filtros),
    enabled: enabled && Boolean(filtros?.desde && filtros?.hasta),
    queryFn: () => fetchGananciasPorCiudad(filtros),
  });
}

