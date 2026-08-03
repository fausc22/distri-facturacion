# Hardening Backlog v4 (remanente)

Fecha: 2026-06-16

Este archivo reemplaza al backlog v3 anterior y contiene únicamente el remanente real tras ejecutar el plan de cierre.

## P0 — Crítico próximo plan

### 1) Completar migración RHF + Zod en todo el dominio comercial
- **Estado actual**: base implementada y 3 flujos migrados.
- **Falta**: extender a formularios de clientes/proveedores/empleados, notas y edición avanzada de pedidos.
- **Esfuerzo**: Alto.
- **Aceptación**: formularios críticos con validación homogénea y errores inline.

### 2) Decisión final de stack PWA (migración controlada)
- **Estado actual**: `next-pwa` endurecido y sync automática operativa.
- **Falta**: PoC comparativo y decisión final de plataforma SW para Next moderno.
- **Esfuerzo**: Medio-Alto.
- **Aceptación**: matriz de pruebas offline/online con estrategia de rollback aprobada.

### 3) Background sync con observabilidad
- **Estado actual**: auto-sync al evento `online` con backoff.
- **Falta**: métricas de intentos/success/fail por pedido y panel de diagnóstico operativo.
- **Esfuerzo**: Medio.
- **Aceptación**: trazabilidad de sincronización por ciclo y alertas de fallas recurrentes.

## P1 — Importante

### 4) Unificación final de selectores (hybrid incluido)
- **Estado actual**: unificación aplicada en variantes LP/legacy mediante `contextAdapter`.
- **Falta**: absorber `SelectorClientesHybrid` / `SelectorProductosHybrid` en la misma API única.
- **Esfuerzo**: Medio.
- **Aceptación**: una implementación por entidad (cliente/producto) para todos los contextos.

### 5) Migración completa `PedidosContext` -> Zustand
- **Estado actual**: híbrido entre context y stores.
- **Falta**: cortar dependencia de reducer legacy y consolidar estado de dominio/UI.
- **Esfuerzo**: Alto.
- **Aceptación**: `PedidosContext` fuera de rutas principales sin regresión offline.

## P2 — Mejora continua

### 6) Migración de toast a Sonner (si se aprueba estándar)
- **Estado actual**: `react-hot-toast` con wrapper parcial.
- **Falta**: sustitución total y cleanup de imports directos.
- **Esfuerzo**: Medio.
- **Aceptación**: notificaciones homogéneas y sin imports legacy.

### 7) Telemetría UX/performance
- **Falta**: KPIs por pantalla (TTI, errores por modal, sync success-rate).
- **Esfuerzo**: Medio.
- **Aceptación**: dashboard base y umbrales de salud definidos.
