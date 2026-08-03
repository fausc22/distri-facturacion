import { useEffect, useState } from 'react';
import Head from 'next/head';
import useAuth from '../../hooks/useAuth';
import { ControlStockProvider } from '../../context/ControlStockContext';
import LibroIvaVentas from '../../components/listados/LibroIvaVentas';
import ListaPrecios from '../../components/listados/ListaPrecios';
import ControlStock from '../../components/listados/ControlStock';
import ListadoVendedores from '../../components/listados/ListadoVendedores';
import ResumenCuenta from '../../components/listados/ResumenCuenta';
import { useListadosUIStore } from '@/stores/listadosUIStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, ClipboardList, Package, Users, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'libro-iva', name: 'Libro IVA Ventas', icon: FileText },
  { id: 'lista-precios', name: 'Lista de Precios', icon: ClipboardList },
  { id: 'control-stock', name: 'Control de Stock', icon: Package },
  { id: 'listado-vendedores', name: 'Listado Vendedores', icon: Users },
  { id: 'resumen-cuenta', name: 'Resumen de Cuenta', icon: Receipt },
];

function ListadosContent() {
  const { tabActiva, setTabActiva } = useListadosUIStore();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-2 sm:p-4">
      <Head>
        <title>VERTIMAR | LISTADOS</title>
        <meta name="description" content="Generador de listados gerenciales" />
      </Head>

      <Card className="w-full max-w-6xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl sm:text-3xl">LISTADOS GERENCIALES</CardTitle>
        </CardHeader>
        <CardContent>
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

          <div className="transition-all duration-300">
            {tabActiva === 'libro-iva' && <LibroIvaVentas />}
            {tabActiva === 'lista-precios' && <ListaPrecios />}
            {tabActiva === 'control-stock' && <ControlStock />}
            {tabActiva === 'listado-vendedores' && <ListadoVendedores />}
            {tabActiva === 'resumen-cuenta' && <ResumenCuenta />}
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

export default function Listados() {
  useAuth();

  return (
    <ControlStockProvider>
      <ListadosContent />
    </ControlStockProvider>
  );
}
