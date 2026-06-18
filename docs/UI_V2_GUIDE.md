# Frontend v2 — Guía de estilo mínima

## Stack
- **UI**: shadcn-style primitives en `components/ui/`
- **Estilos**: Tailwind + tokens CSS en `styles/globals.css`
- **Server state**: React Query (`hooks/queries/`)
- **UI state**: Zustand (`stores/`)

## Reglas para componentes nuevos
1. Usar primitives de `components/ui/` (Button, Input, Select, Dialog, Badge, Card).
2. No agregar HeroUI ni PrimeReact en módulos migrados.
3. Modales: `ConfirmModal`, `AlertModal`, `FormModal` en `components/shared/`.
4. Tablas: `DataTable` en `components/tables/DataTable.jsx`.
5. Fechas mes/año: `MonthYearPicker` reutilizable.
6. Notificaciones: `import toast from '@/components/shared/toast'`.

## Variantes semánticas
- `primary` — acción principal
- `secondary` — acción secundaria
- `danger` — destructivo
- `ghost` / `outline` — acciones terciarias

## Tokens
Variables CSS `--background`, `--primary`, `--muted`, etc. en `:root`.
Radios: `--radius` (0.5rem).
Sombras: `shadow-sm` en cards, `shadow-lg` en modales.

## Módulos migrados a v2
- Listados (`pages/finanzas/Listados.jsx`)
- Ventas historial (`pages/ventas/Facturacion.jsx` — UI state)
- Finanzas ingresos/egresos (UI state + queries)

## Legacy pendiente
Ver `LEGACY_UI.md`.
