# Decisión técnica — PWA stack v4

## Contexto
Proyecto Next 15 con operación PWA offline-first para fuerza de ventas. El sistema ya utiliza `next-pwa` y una capa de sincronización de pedidos pendientes.

## Decisión para esta etapa
Se mantiene `next-pwa` en el corto plazo, con hardening de estrategias de cache y sincronización automática al recuperar conectividad, para minimizar riesgo operativo inmediato.

## Justificación
- Evita una migración de service worker de alto riesgo en un ciclo de cierre.
- Permite resolver primero confiabilidad de negocio (pedidos offline y sincronización).
- Conserva compatibilidad con los flujos actuales de precache/fallback.

## Cambios aplicados en la etapa
- Rebalanceo de cache en rutas críticas para reducir stale data.
- Sincronización automática de pedidos pendientes al evento `online` con backoff.
- Ejecución global de sincronización desde inicialización de app.

## Criterios para migración futura de stack
Migrar a alternativa moderna solo si se cumplen:
1. Suite de pruebas offline/online reproducible.
2. Matriz de rollback definida.
3. Métricas de sincronización estables en producción.

## Próximo paso recomendado
Evaluación comparativa controlada (`next-pwa` vs alternativa moderna) en rama aislada, con test de reconexión, stale-cache y actualización de SW.
