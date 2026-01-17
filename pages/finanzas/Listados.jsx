import { useState, useEffect } from 'react';
import Head from 'next/head';
import { toast } from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';
import { ControlStockProvider } from '../../context/ControlStockContext';
import LibroIvaVentas from '../../components/listados/LibroIvaVentas';
import ListaPrecios from '../../components/listados/ListaPrecios';
import ControlStock from '../../components/listados/ControlStock';
import ListadoVendedores from '../../components/listados/ListadoVendedores';

// Configuración de pestañas
const TABS = [
  {
    id: 'libro-iva',
    name: 'Libro IVA Ventas',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  },
  {
    id: 'lista-precios',
    name: 'Lista de Precios',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    )
  },
  {
    id: 'control-stock',
    name: 'Control de Stock',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    )
  },
  {
    id: 'listado-vendedores',
    name: 'Listado Vendedores',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  }
];

function ListadosContent() {
  const [tabActiva, setTabActiva] = useState('libro-iva');
  const [isMobile, setIsMobile] = useState(false);

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const tabActual = TABS.find(tab => tab.id === tabActiva);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-2 sm:p-4">
      <Head>
        <title>VERTIMAR | LISTADOS</title>
        <meta name="description" content="Generador de listados gerenciales" />
      </Head>

      <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6 w-full max-w-6xl">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center text-gray-800">
          LISTADOS GERENCIALES
        </h1>

        {/* Navegación por pestañas */}
        <div className="mb-4 sm:mb-6">
          {/* Tabs para Desktop */}
          <div className="hidden md:block">
            <nav className="flex space-x-4 border-b border-gray-200">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setTabActiva(tab.id)}
                  className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
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
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
              <select
                value={tabActiva}
                onChange={(e) => setTabActiva(e.target.value)}
                className="w-full text-base border-0 bg-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none rounded-md"
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

        {/* Contenido del Tab Activo */}
        <div className="transition-all duration-300">
          {tabActiva === 'libro-iva' && <LibroIvaVentas />}
          {tabActiva === 'lista-precios' && <ListaPrecios />}
          {tabActiva === 'control-stock' && <ControlStock />}
          {tabActiva === 'listado-vendedores' && <ListadoVendedores />}
        </div>

        {/* Botón Volver */}
        <div className="flex justify-center mt-6 sm:mt-8">
          <button
            onClick={() => (window.location.href = '/inicio')}
            className="bg-red-600 hover:bg-red-700 px-6 sm:px-8 py-2 sm:py-3 rounded-md text-white font-semibold transition-colors w-full sm:w-auto"
          >
            Volver al Menú
          </button>
        </div>
      </div>
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
