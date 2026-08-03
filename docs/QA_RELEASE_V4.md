# QA release v4

Fecha: 2026-06-16

## Validación técnica ejecutada
- Build: `npm run build` exitoso.
- Estado: compilación en verde con warnings históricos no bloqueantes (hooks/a11y/img).

## Cobertura funcional validada en código
- Forms:
  - `FormularioGasto` integrado con `react-hook-form` + `zod`.
  - `ModalConfirmacionCompraCompleto` validación con esquema `zod`.
  - `ModalesVentaDirecta` (descuentos/facturación) con validación de esquema.
- PWA/sync:
  - Sincronización automática al recuperar conectividad con backoff en `useOfflinePedidos`.
  - Activación global de sync en inicialización de app.
- Selectores:
  - API de selector unificada por `contextAdapter` en clientes/productos.
  - Wrappers LP reutilizando implementación núcleo.

## Pendiente manual recomendado (smoke operativo)
- `Facturacion`: filtros, selección, solicitud CAE y modales.
- `RegistrarPedido`: alta offline, reconexión y sync automática.
- `RegistrarCompra` / `RegistrarGasto`: validación de formularios y confirmación.
- `ListaPrecios`: selector cliente/producto unificado en flujo LP.
