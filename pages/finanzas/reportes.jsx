import { useState } from 'react';
import Head from 'next/head';
import useAuth from '../../hooks/useAuth';
import { ReportesProvider } from '../../context/ReportesContext';
import { ReportesFiltros, FiltrosCompactos, IndicadoresFiltros } from '../../components/reportes/ReportesFiltros';
import { DashboardReportes } from '../../components/reportes/DashboardReportes';
import { VentasAnalytics } from '../../components/reportes/VentasAnalytics';
import { FinancialBalance } from '../../components/reportes/FinancialBalance';
import { ProductAnalytics } from '../../components/reportes/ProductAnalytics';
import { GeographicAnalytics } from '../../components/reportes/GeographicAnalytics';
import { toast, Toaster } from 'react-hot-toast';

// Configuración de pestañas
const TABS = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    component: DashboardReportes
  },
  {
    id: 'ventas',
    name: 'Análisis de Ventas',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    component: VentasAnalytics
  },
  {
    id: 'financiero',
    name: 'Balance Financiero',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
      </svg>
    ),
    component: FinancialBalance
  },
  {
    id: 'productos',
    name: 'Análisis de Productos',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    component: ProductAnalytics
  },
  {
    id: 'geografico',
    name: 'Análisis Geográfico',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    component: GeographicAnalytics
  }
];

function ReportesContent() {
  const [tabActiva, setTabActiva] = useState('dashboard');
  const [isMobile, setIsMobile] = useState(false);

  // Detectar si es móvil
  useState(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const tabActual = TABS.find(tab => tab.id === tabActiva);
  const ComponenteActivo = tabActual?.component;

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>VERTIMAR | Reportes Financieros</title>
        <meta name="description" content="Dashboard y reportes financieros del sistema VERTIMAR" />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Principal */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reportes Financieros</h1>
              <p className="mt-1 text-sm text-gray-500">
                Análisis completo de performance financiera y operativa
              </p>
            </div>
            
            {/* Indicador de modo móvil */}
            {isMobile && (
              <div className="mt-3 sm:mt-0">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Vista móvil
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Filtros - Compactos en móvil, completos en desktop */}
        <div className="mb-6">
          {isMobile ? (
            <FiltrosCompactos />
          ) : (
            <ReportesFiltros />
          )}
          
          {/* Indicadores de filtros activos */}
          <div className="mt-3">
            <IndicadoresFiltros />
          </div>
        </div>

        {/* Navegación por pestañas */}
        <div className="mb-6">
          {/* Tabs para Desktop */}
          <div className="hidden md:block">
            <nav className="flex space-x-8 border-b border-gray-200">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setTabActiva(tab.id)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    tabActiva === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tabs para Móvil - Dropdown */}
          <div className="md:hidden">
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <select
                value={tabActiva}
                onChange={(e) => setTabActiva(e.target.value)}
                className="w-full text-base border-0 bg-transparent focus:ring-0 focus:outline-none"
              >
                {TABS.map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Contenido del Reporte Activo */}
        <div className="transition-all duration-300">
          {ComponenteActivo ? (
            <ComponenteActivo />
          ) : (
            <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Reporte no disponible</h3>
              <p className="mt-1 text-sm text-gray-500">El componente seleccionado no se pudo cargar.</p>
            </div>
          )}
        </div>

       
      </div>

      {/* Toast Container */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 2000,
            style: {
              background: '#10b981',
            },
          },
          error: {
            duration: 4000,
            style: {
              background: '#ef4444',
            },
          },
        }}
      />
    </div>
  );
}

// Página principal con Provider
export default function ReportesFinancieros() {
  // Verificar autenticación
  useAuth();

  return (
    <ReportesProvider>
      <ReportesContent />
    </ReportesProvider>
  );
}

