import Link from 'next/link';
import { useRouter } from 'next/router';

const LABELS = {
  ventas: 'Ventas',
  finanzas: 'Finanzas',
  compras: 'Compras',
  inventario: 'Inventario',
  edicion: 'Edición',
  inicio: 'Inicio',
  Facturacion: 'Facturación',
  RegistrarPedido: 'Registrar pedido',
  VentaDirecta: 'Venta directa',
  HistorialPedidos: 'Historial pedidos',
  HistorialCompras: 'Historial compras',
  fondos: 'Fondos',
  ingresos: 'Ingresos',
  egresos: 'Egresos',
  reportes: 'Reportes',
};

function prettify(segment) {
  return LABELS[segment] || segment.replace(/[-_]/g, ' ');
}

export default function PageBreadcrumbs() {
  const router = useRouter();
  const parts = router.asPath.split('?')[0].split('/').filter(Boolean);

  if (parts.length === 0) return null;

  return (
    <nav aria-label="breadcrumb" className="mb-4 text-xs text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1">
        <li>
          <Link href="/inicio" className="hover:text-foreground">
            Inicio
          </Link>
        </li>
        {parts.map((part, index) => {
          const href = `/${parts.slice(0, index + 1).join('/')}`;
          const isLast = index === parts.length - 1;
          return (
            <li key={href} className="flex items-center gap-1">
              <span>/</span>
              {isLast ? (
                <span className="font-medium text-foreground">{prettify(part)}</span>
              ) : (
                <Link href={href} className="hover:text-foreground">
                  {prettify(part)}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
