# Catálogo UI — Frontend v2 (Fase 2 completada)

Última actualización: migración vertical Fondos, Compras, Pedidos, Reportes + retiro legacy.

## Dependencias retiradas

- `primereact` — desinstalado (sin imports en código)
- `@heroui/*` — desinstalado (solo usado en tailwind plugin, removido)

## Dependencias mantenidas

- `react-hot-toast` — motor global en `_app.jsx`; módulos migrados usan `@/components/shared/toast`

## Módulos migrados a stack v2

| Módulo | Estado |
|--------|--------|
| Listados | Completo |
| Ingresos / Egresos | Completo |
| Fondos | Completo (React Query + Zustand + DataTable) |
| Compras (registro + historial) | Completo |
| Gastos | Completo |
| RegistrarPedido | UI v2 (PedidosContext intacto, offline preservado) |
| HistorialPedidos | React Query + Zustand + DataTable |
| Facturacion | Zustand modales + DataTable en TablaVentas |
| Reportes (6 tabs) | Shell v2 + queries infra |
| VentaDirecta / ListaPrecios ventas | Shell Card v2 |

## Pendiente / diferido

- Unificación selectores pedidos (legacy / hybrid / LP) en un solo componente
- `PedidosContext` → Zustand completo (carrito compartido con notas y venta directa)
- Selectores internos de compras/pedidos (lógica de negocio sin cambios)

## Componentes v2

Ver `docs/UI_V2_GUIDE.md` y `docs/SMOKE_TESTS_V2.md`.
