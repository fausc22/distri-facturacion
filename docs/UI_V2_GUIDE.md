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
- `primary` — acción principal (azul marca)
- `secondary` — acción secundaria
- `danger` — destructivo (rojo)
- `ghost` / `outline` — acciones terciarias

## Tokens (identidad visual master)

Variables CSS en `:root` (`styles/globals.css`). Radios: `--radius` (0.5rem).
Sombras: `shadow-sm` en cards, `shadow-lg` en modales.

| Token | HSL | Hex aprox. | Uso |
|---|---|---|---|
| `--primary` | `221 83% 53%` | `#2563eb` | Botones, FAB, acentos, focus |
| `--primary-foreground` | `0 0% 100%` | `#ffffff` | Texto sobre primary |
| `--brand` | `217 91% 60%` | `#3b82f6` | Navbar online |
| `--brand-foreground` | `0 0% 100%` | `#ffffff` | Texto sobre brand |
| `--ring` | `221 83% 53%` | `#2563eb` | Focus rings |
| `--accent` | `214 95% 93%` | ~`#dbeafe` | Hover ghost/outline |
| `--offline` / `--warning` | `25 95% 53%` | `#f97316` | Navbar offline / avisos |
| `--success` | `142 71% 45%` | `#16a34a` | Éxito |
| `--destructive` | `0 84.2% 60.2%` | `#ef4444` | Peligro |

### `primary-dark` no es marca

`primary-dark` (`#0D2438` en `tailwind.config.js`) es una **superficie oscura de contraste** (selectores de clientes, paneles). No usarlo como color de marca; la marca es `primary` / `brand`.

### Colores por módulo (inicio)

Mapa estático en `lib/moduleThemes.js` (clases Tailwind completas, purge-safe):

| Módulo | Header | Hover links |
|---|---|---|
| Ventas | emerald (naranja si offline) | emerald-50/100 |
| Inventario | blue | blue-50/100 |
| Finanzas | teal | teal-50/100 |
| Edición / Administración | purple | purple-50/100 |
| Compras | amber | amber-50/100 |

## Módulos migrados a v2
- Listados (`pages/finanzas/Listados.jsx`)
- Ventas historial (`pages/ventas/Facturacion.jsx` — UI state)
- Finanzas ingresos/egresos (UI state + queries)

## Legacy pendiente
Ver `LEGACY_UI.md`.
