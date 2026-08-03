# Guardrails UX Release — No tocar en cambios de UI

Esta tanda de mejoras es **solo presentación/estado de UI**. No modificar:

## PWA / Cache
- `frontend/next.config.js` — `runtimeCaching`, `additionalManifestEntries`, `fallbacks`, `skipWaiting`
- `frontend/utils/offlineManager.js` — claves `vertimar_*`, shape de catálogo offline
- `frontend/context/ConnectionContext.js` — lógica de modo offline y reconexión
- `frontend/pages/_app.jsx` — precarga de rutas, `controllerchange`, `__forcePwaUpdate`
- `frontend/hooks/useOfflineCatalog.js` — sync catálogo y pedidos pendientes

## Lógica de negocio
- `frontend/context/PedidosContext.js` — carrito, totales, persistencia
- `frontend/hooks/pedidos/usePedidosHybrid.js` — registro offline/sync
- `frontend/hooks/ventas/useVentaDirecta.js` — payload venta directa
- `frontend/hooks/pedidos/useFacturacion.js` — facturación AFIP
- Contratos API y payloads al backend

## Validación de regresión obligatoria
- Registrar pedido online/offline + sync
- Venta directa completa (flete + facturación)
- Historial filtros solo al confirmar "Filtrar"
- Edición producto con precio con IVA → neto correcto en BD
