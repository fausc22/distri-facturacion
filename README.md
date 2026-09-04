# ERP Distri — Frontend

Aplicación web progresiva (PWA) para la gestión integral de una distribuidora. Permite operar ventas, pedidos, inventario, compras, finanzas y administración desde cualquier dispositivo, con soporte offline para las operaciones críticas.

---

## Tecnologías

| Tecnología | Uso |
|---|---|
| **Next.js 15** | Framework principal (SSR/CSR, routing) |
| **React 18** | Librería de UI |
| **Tailwind CSS** | Estilos utilitarios |
| **Framer Motion** | Animaciones de transición |
| **Zustand** | Estado global liviano |
| **TanStack Query** | Caché y sincronización de datos servidor |
| **Axios** | Cliente HTTP con interceptores JWT |
| **react-hot-toast** | Sistema de notificaciones toast |
| **react-hook-form** | Formularios con validación |
| **next-pwa** | Service Worker y soporte offline |
| **react-window** | Virtualización de listas largas |

---

## Módulos del sistema

### Ventas
- **Registrar Pedido** — Creación de pedidos con selector de cliente y productos, modo offline-first (PWA guarda en IndexedDB y sincroniza al reconectar).
- **Venta Directa** — Facturación inmediata con ajuste de precios, caché de borrador 24 h, integración con ARCA/AFIP para generación de CAE.
- **Historial de Pedidos** — Listado paginado, cambio de estado, facturación desde el historial, notas de pedido.
- **Historial Offline** — Vista solo-lectura de pedidos guardados localmente mientras la app está offline.
- **Facturación** (GERENTE) — Gestión de ventas facturadas, generación de comprobantes PDF, links públicos de comprobante.
- **Lista de Precios** (GERENTE) — Generación de lista imprimible agrupada por categoría.
- **Comprobantes** — Historial de comprobantes fiscales con filtros.

### Inventario
- **Gestión de Productos** (GERENTE) — ABM de productos con categorías, precios, unidad de medida y stock mínimo.
- **Consulta de Stock** — Vista en tiempo real del stock por producto y categoría, con indicadores de nivel bajo.
- **Remitos** — Historial de remitos de entrega vinculados a pedidos.

### Compras
- **Registrar Compra** — Alta de compras con proveedores, actualización automática de stock.
- **Historial de Compras** — Listado filtrable con detalle de ítems comprados.
- **Registrar Gasto** (GERENTE) — Alta de egresos no vinculados a stock (servicios, alquileres, etc.).

### Finanzas
- **Fondos** — Estado actual de cada cuenta (efectivo, banco, cuenta corriente, etc.).
- **Reportes** — Dashboard de ingresos vs. egresos con gráficos y filtros por período y cuenta.
- **Ingresos / Egresos** — Historial detallado de movimientos financieros con exportación.
- **Listados** — Resumen de cuentas por período.

### Administración
- **Clientes** — ABM de clientes con datos fiscales (CUIT/DNI), condición IVA y consulta a ARCA/AFIP.
- **Proveedores** — ABM de proveedores.
- **Empleados** — ABM de empleados con asignación de rol (GERENTE / VENDEDOR).

### Auditoría (GERENTE)
- Log de todas las operaciones críticas del sistema con usuario, fecha y descripción.

---

## Roles y permisos

| Pantalla | GERENTE | VENDEDOR |
|---|---|---|
| Registrar Pedido | ✅ | ✅ |
| Venta Directa | ✅ | ❌ |
| Facturación | ✅ | ❌ |
| Lista de Precios | ✅ | ❌ |
| Gestión de Productos | ✅ | ❌ |
| Registrar Gasto | ✅ | ❌ |
| Finanzas completa | ✅ | ❌ |
| Auditoría | ✅ | ❌ |
| Historial de Pedidos | ✅ | ✅ |
| Consulta de Stock | ✅ | ✅ |
| Remitos | ✅ | ✅ |

---

## Autenticación

- **JWT** — Access token de corta duración + refresh token en `localStorage`.
- `apiClient.js` centraliza todos los pedidos HTTP con refresco automático de token.
- Si el refresh token expira o no existe, se redirige a `/login` con un toast claro ("Sesión expirada").
- Rutas protegidas a nivel de página con `useEffect` guard, independientemente del menú.

---

## PWA y modo offline

- Service Worker generado por `next-pwa`.
- Catálogo de clientes y productos disponible sin conexión (IndexedDB via `offlineManager`).
- Los pedidos se guardan localmente y se sincronizan automáticamente al reconectar.
- `ConnectionContext` gestiona el estado online/offline de toda la app; la reconexión es siempre manual.

---

## Estructura de carpetas

```
frontend/
├── components/         # Componentes reutilizables por módulo
│   ├── shared/         # toast.js, modales genéricos, CRUD maestro
│   ├── pedidos/        # Selectores, carrito, historial
│   ├── ventas/         # VentaDirecta, modales de venta
│   ├── productos/      # ABM productos, ajuste de stock
│   ├── compra/         # Selector y carrito de compras
│   └── ...
├── context/            # ConnectionContext (estado de conexión global)
├── hooks/              # Lógica de negocio desacoplada de la UI
│   ├── pedidos/        # usePedidosHybrid, useHistorialPedidos, useFacturacion
│   ├── ventas/         # useVentaDirecta, useComprobantes
│   └── ...
├── pages/              # Rutas de Next.js (un archivo = una ruta)
├── utils/              # apiClient.js, offlineManager.js, formatters
├── constants/          # zIndex, stockThresholds, queryKeys
└── styles/             # globals.css, Tailwind config
```

---

## Variables de entorno

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL base del backend (ej. `https://api.midominio.com`) |

---

## Comandos

```bash
npm install        # Instalar dependencias
npm run dev        # Desarrollo (http://localhost:3000)
npm run build      # Build de producción
npm run start      # Iniciar build en producción
npm run lint       # Lint con ESLint
```
