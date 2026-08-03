export const queryKeys = {
  ingresos: {
    all: ['ingresos'],
    historial: (params) => ['ingresos', 'historial', params],
    cuentas: ['ingresos', 'cuentas'],
  },
  egresos: {
    all: ['egresos'],
    historial: (params) => ['egresos', 'historial', params],
    cuentas: ['egresos', 'cuentas'],
  },
  ventas: {
    all: ['ventas'],
    historial: (params) => ['ventas', 'historial', params],
  },
  listados: {
    categorias: ['listados', 'categorias'],
    empleados: ['listados', 'empleados'],
  },
  fondos: {
    all: ['fondos'],
    cuentas: ['fondos', 'cuentas'],
    movimientos: (params) => ['fondos', 'movimientos', params],
  },
  compras: {
    all: ['compras'],
    historial: (params) => ['compras', 'historial', params],
    list: ['compras', 'list'],
    gastos: ['compras', 'gastos'],
    productos: (compraId) => ['compras', 'productos', compraId],
  },
  pedidos: {
    all: ['pedidos'],
    historial: (params) => ['pedidos', 'historial', params],
  },
  reportes: {
    all: ['reportes'],
    dashboard: (params) => ['reportes', 'dashboard', params],
    gerencial: (params) => ['reportes', 'gerencial', params],
    ventas: (params) => ['reportes', 'ventas', params],
    balance: (params) => ['reportes', 'balance', params],
    productos: (params) => ['reportes', 'productos', params],
    geografico: (params) => ['reportes', 'geografico', params],
  },
};
