import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import useAuth from '../../hooks/useAuth';
import { ReportesProvider } from '../../context/ReportesContext';
import { VentasAnalytics } from '../../components/reportes/VentasAnalytics';
import { FinancialBalance } from '../../components/reportes/FinancialBalance';
import { ProductAnalytics } from '../../components/reportes/ProductAnalytics';
import { GeographicAnalytics } from '../../components/reportes/GeographicAnalytics';
import { ReporteGerencial } from '../../components/reportes/ReporteGerencial';
import { ResultadoNeto } from '../../components/reportes/ResultadoNeto';
import { SelectorPeriodoReportes } from '../../components/reportes/SelectorPeriodoReportes';
import { useReportesUIStore } from '@/stores/reportesUIStore';
import { usePeriodoReportes } from '../../hooks/usePeriodoReportes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  TrendingUp,
  DollarSign,
  Package,
  MapPin,
  Scale,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'gerencial', name: 'Reporte Gerencial', icon: FileText, component: ReporteGerencial },
  { id: 'ventas', name: 'Análisis de Ventas', icon: TrendingUp, component: VentasAnalytics },
  { id: 'resultado', name: 'Resultado Neto', icon: Scale, component: ResultadoNeto },
  { id: 'financiero', name: 'Balance Financiero', icon: DollarSign, component: FinancialBalance },
  { id: 'productos', name: 'Análisis de Productos', icon: Package, component: ProductAnalytics },
  { id: 'geografico', name: 'Análisis Geográfico', icon: MapPin, component: GeographicAnalytics },
];

function BarraPeriodoCompartida({ onRecargar, loading }) {
  const periodo = usePeriodoReportes();
  return (
    <SelectorPeriodoReportes
      {...periodo}
      onRecargar={onRecargar}
      loading={loading}
    />
  );
}

function ReportesContent() {
  const { user } = useAuth();
  const router = useRouter();
  const { tabActiva, setTabActiva } = useReportesUIStore();
  const { rango, etiquetaPeriodo } = usePeriodoReportes();
  const [isMobile, setIsMobile] = useState(false);
  const [recargarKey, setRecargarKey] = useState(0);

  useEffect(() => {
    if (user && user.rol !== 'GERENTE') {
      router.push('/inicio');
    }
  }, [user, router]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const tabActual = TABS.find((tab) => tab.id === tabActiva) || TABS[0];
  const ComponenteActivo = tabActual?.component;

  const handleRecargar = () => setRecargarKey((k) => k + 1);

  if (!user || user.rol !== 'GERENTE') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md p-8 text-center shadow-lg">
          <CardHeader>
            <CardTitle>Acceso Restringido</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-muted-foreground">
              Solo los gerentes pueden acceder a los reportes financieros.
            </p>
            <Button type="button" onClick={() => router.push('/inicio')}>
              Volver al Inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-2 sm:p-4">
      <Head>
        <title>VERTIMAR | Reportes Financieros</title>
        <meta name="description" content="Reportes financieros del sistema VERTIMAR" />
      </Head>

      <Card className="w-full max-w-7xl shadow-lg">
        <CardHeader className="text-center">
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
            <CardTitle className="text-2xl sm:text-3xl">REPORTES FINANCIEROS</CardTitle>
            {isMobile && <Badge variant="info">Vista móvil</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">
            Ventas facturadas, egresos (compras/gastos) y movimientos de caja · {etiquetaPeriodo}
          </p>
          <p className="text-xs text-muted-foreground">
            Rango: {rango.desde} al {rango.hasta}
          </p>
        </CardHeader>

        <CardContent>
          <div className="mb-4 sm:mb-6">
            <BarraPeriodoCompartida onRecargar={handleRecargar} />
          </div>

          <div className="mb-4 sm:mb-6">
            {!isMobile ? (
              <nav className="flex space-x-1 overflow-x-auto border-b">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setTabActiva(tab.id)}
                      className={cn(
                        'flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                        tabActiva === tab.id
                          ? 'border-primary text-primary'
                          : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{tab.name}</span>
                    </button>
                  );
                })}
              </nav>
            ) : (
              <Select value={tabActiva} onValueChange={setTabActiva}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TABS.map((tab) => (
                    <SelectItem key={tab.id} value={tab.id}>
                      {tab.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="transition-all duration-300" key={`${tabActiva}-${recargarKey}-${rango.desde}-${rango.hasta}`}>
            {ComponenteActivo ? (
              <ComponenteActivo />
            ) : (
              <div className="rounded-lg border p-8 text-center text-muted-foreground">
                El reporte seleccionado no se pudo cargar.
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-center sm:mt-8">
            <Button
              variant="danger"
              className="w-full sm:w-auto"
              onClick={() => {
                window.location.href = '/inicio';
              }}
            >
              Volver al Menú
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ReportesFinancieros() {
  return (
    <ReportesProvider>
      <ReportesContent />
    </ReportesProvider>
  );
}
