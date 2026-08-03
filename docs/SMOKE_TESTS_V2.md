# Smoke Tests — Frontend v2

Checklist manual para validar módulos migrados. Ejecutar antes y después de cada PR de la Fase 2.

## Listados (`/finanzas/Listados`)

- [ ] Tabs desktop y selector móvil cambian contenido
- [ ] Libro IVA: `MonthYearPicker` + generar PDF + modal PDF
- [ ] Listado Vendedores: vendedor + mes/año + generar PDF
- [ ] Lista Precios: selección categorías + generar PDF
- [ ] Control Stock: modos selección/filtro + generar PDF
- [ ] Botón "Volver al Menú" funciona

## Ingresos (`/finanzas/ingresos`)

- [ ] Lista carga al abrir
- [ ] Filtros y paginación aplican
- [ ] Nuevo ingreso: registrar y lista se actualiza
- [ ] Ver detalle de un ingreso
- [ ] Sin errores en consola

## Egresos (`/finanzas/egresos`)

- [ ] Igual checklist que ingresos

## Facturacion (`/ventas/Facturacion`)

- [ ] Paginación servidor
- [ ] Filtros aplican
- [ ] Selección múltiple de ventas
- [ ] Modal detalle (doble click o acción)
- [ ] Modal comprobante
- [ ] Modales nota débito/crédito abren sin error de dynamic import
- [ ] Sin errores en consola

## Fondos (`/finanzas/fondos`) — Fase 2

- [ ] Tabs cuentas / movimientos
- [ ] Crear cuenta nueva
- [ ] Ingreso / egreso / transferencia
- [ ] Filtros movimientos
- [ ] Saldos se actualizan tras operación

## Compras — Fase 2

- [ ] Registrar compra end-to-end
- [ ] Registrar gasto end-to-end
- [ ] Historial compras: filtros, paginación, detalle

## Pedidos — Fase 2

- [ ] Registrar pedido online
- [ ] Registrar pedido offline (PWA)
- [ ] Historial pedidos: filtros, edición, modales

## Reportes — Fase 2

- [ ] Cada tab carga datos
- [ ] Filtros globales aplican
- [ ] PDF gerencial / dashboard si aplica

## Criterio de salida

Cero regressions en módulos ya validados antes de mergear el siguiente PR.
