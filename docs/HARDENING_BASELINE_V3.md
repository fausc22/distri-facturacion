# Hardening Baseline v3

Fecha: 2026-06-16

## Alcance revisado
- Ventas: `Facturacion`, `RegistrarPedido`, `VentaDirecta`, `HistorialPedidos`
- Finanzas: `fondos`, `ingresos`, `egresos`, `reportes`
- PWA: fallback offline, cache runtime y navegación privada

## Estado inicial detectado
- `react-hot-toast` sigue siendo el sistema de notificaciones global.
- Existen componentes v2 (`Button`, `Badge`, `Card`, `Dialog`, `DataTable`) y conviven con bloques legacy.
- Persisten hardcodes de color azul en header y pantallas históricas.
- Se detectan confirmaciones con `window.confirm(...)` en pantallas críticas.
- La estrategia de cache PWA para rutas críticas estaba orientada a `CacheFirst` agresivo.

## Métricas/chequeos base
- Build de producción: requerido al cierre.
- Smoke manual mínimo:
  - `Facturacion`: filtros, selección múltiple, CAE, modales.
  - `RegistrarPedido`: flujo online/offline, persistencia, reconexión.
  - `fondos`: cuentas, movimientos, transferencias.
  - `reportes`: tabs principales y estado de carga.

## Criterio de aceptación de hardening
- Sin regresiones funcionales en rutas críticas.
- Confirmaciones críticas en patrón modal unificado.
- Mayor consistencia visual en layout/header/acciones.
- Documento de backlog V3 publicado para diferidos estructurales.
