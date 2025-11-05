import { useEffect, useState } from 'react';
import { useReportesContext } from '../../context/ReportesContext';
import { MetricsCard, FinancialMetricsCard, MetricsGrid } from '../charts/MetricsCard';
import { CustomLineChart, CustomBarChart, CustomAreaChart } from '../charts/CustomCharts';

export function FinancialBalance() {
  const {
    cargarDatos,
    isLoading,
    getData,
    getTotales,
    formatCurrency,
    formatPercentage,
    filtros
  } = useReportesContext();

  const [datosBalance, setDatosBalance] = useState({
    balanceGeneral: null,
    balancePorCuenta: null,
    flujoDeFondos: null,
    totalesBalance: null
  });

  // Cargar datos cuando cambie el componente o filtros
  useEffect(() => {
    cargarDatosBalance();
  }, [filtros]);

  const cargarDatosBalance = async () => {
    try {
      const [balance, cuentas, flujo] = await Promise.all([
        cargarDatos('balanceGeneral'),
        cargarDatos('balancePorCuenta'),
        cargarDatos('flujoDeFondos')
      ]);

      setDatosBalance({
        balanceGeneral: balance.success ? balance.data : null,
        balancePorCuenta: cuentas.success ? cuentas.data : null,
        flujoDeFondos: flujo.success ? flujo.data : null,
        totalesBalance: balance.success ? balance.totales : null
      });
    } catch (error) {
      console.error('Error cargando datos de balance:', error);
    }
  };

  const { 
    balanceGeneral, 
    balancePorCuenta, 
    flujoDeFondos, 
    totalesBalance 
  } = datosBalance;

  const isLoadingAny = isLoading('balanceGeneral') || 
                      isLoading('balancePorCuenta') || 
                      isLoading('flujoDeFondos');

  // Calcular métricas del flujo de fondos
  const flujoTotales = flujoDeFondos?.reduce((acc, item) => ({
    totalIngresos: acc.totalIngresos + (parseFloat(item.ingreso) || 0),
    totalEgresos: acc.totalEgresos + (parseFloat(item.egreso) || 0),
    saldoFinal: acc.saldoFinal + (parseFloat(item.ingreso) || 0) - (parseFloat(item.egreso) || 0)
  }), { totalIngresos: 0, totalEgresos: 0, saldoFinal: 0 }) || {};

  // Preparar datos para gráfico de evolución temporal
  const evolucionBalance = balanceGeneral?.map(item => ({
    periodo: item.mes || item.periodo,
    ingresos: parseFloat(item.ingresos),
    egresos: parseFloat(item.egresos),
    balance: parseFloat(item.balance),
    balanceAcumulado: parseFloat(item.balance) // Se puede calcular acumulado si es necesario
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Balance Financiero</h2>
          <p className="text-sm text-gray-500 mt-1">
            Análisis completo del balance y flujo de fondos
          </p>
        </div>
        
        <button
          onClick={cargarDatosBalance}
          disabled={isLoadingAny}
          className="mt-3 sm:mt-0 flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg 
            className={`w-4 h-4 ${isLoadingAny ? 'animate-spin' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{isLoadingAny ? 'Actualizando...' : 'Actualizar'}</span>
        </button>
      </div>

      {/* KPIs Principales del Balance */}
      <MetricsGrid columns={4}>
        <FinancialMetricsCard
          title="Total Ingresos"
          value={totalesBalance?.totalIngresos || flujoTotales.totalIngresos || 0}
          formatCurrency={formatCurrency}
          color="green"
          loading={isLoadingAny}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
            </svg>
          }
        />

        <FinancialMetricsCard
          title="Total Egresos"
          value={totalesBalance?.totalEgresos || flujoTotales.totalEgresos || 0}
          formatCurrency={formatCurrency}
          color="red"
          loading={isLoadingAny}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
            </svg>
          }
        />

        <FinancialMetricsCard
          title="Balance Total"
          value={totalesBalance?.balanceTotal || flujoTotales.saldoFinal || 0}
          formatCurrency={formatCurrency}
          color={totalesBalance?.balanceTotal >= 0 || flujoTotales.saldoFinal >= 0 ? 'blue' : 'red'}
          loading={isLoadingAny}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          }
        />

        <MetricsCard
          title="Rentabilidad"
          value={formatPercentage(
            totalesBalance?.totalIngresos > 0 
              ? (totalesBalance?.balanceTotal / totalesBalance?.totalIngresos) * 100
              : flujoTotales.totalIngresos > 0 
                ? (flujoTotales.saldoFinal / flujoTotales.totalIngresos) * 100
                : 0
          )}
          color="purple"
          loading={isLoadingAny}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
      </MetricsGrid>

      {/* Evolución del Balance */}
      <CustomLineChart
        data={evolucionBalance}
        xKey="periodo"
        yKeys={[
          { dataKey: 'ingresos', name: 'Ingresos', color: '#10B981' },
          { dataKey: 'egresos', name: 'Egresos', color: '#EF4444' },
          { dataKey: 'balance', name: 'Balance Neto', color: '#3B82F6' }
        ]}
        title="Evolución del Balance Financiero"
        height={350}
        formatCurrency={formatCurrency}
        loading={isLoadingAny}
      />

      {/* Balance por Cuenta */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CustomBarChart
          data={balancePorCuenta}
          xKey="cuenta"
          yKeys={[
            { dataKey: 'ingresos', name: 'Ingresos', color: '#10B981' },
            { dataKey: 'egresos', name: 'Egresos', color: '#EF4444' }
          ]}
          title="Balance por Cuenta"
          height={300}
          formatCurrency={formatCurrency}
          loading={isLoadingAny}
        />

        <CustomAreaChart
          data={evolucionBalance}
          xKey="periodo"
          yKeys={[
            { dataKey: 'balance', name: 'Balance Neto', color: '#3B82F6' }
          ]}
          title="Tendencia del Balance"
          height={300}
          formatCurrency={formatCurrency}
          loading={isLoadingAny}
        />
      </div>

      {/* Tabla de Balance por Cuenta */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Detalle por Cuenta
        </h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cuenta
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ingresos
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Egresos
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  % Participación
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {balancePorCuenta?.map((cuenta, index) => {
                const participacion = totalesBalance?.totalIngresos > 0 
                  ? (cuenta.ingresos / totalesBalance.totalIngresos) * 100 
                  : 0;
                
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {cuenta.cuenta}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-green-600">
                      {formatCurrency(cuenta.ingresos)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-red-600">
                      {formatCurrency(cuenta.egresos)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <span className={cuenta.balance >= 0 ? 'text-blue-600' : 'text-red-600'}>
                        {formatCurrency(cuenta.balance)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                      {formatPercentage(participacion)}
                    </td>
                  </tr>
                );
              }) || (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    {isLoadingAny ? 'Cargando balance por cuenta...' : 'No hay datos de balance disponibles'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resumen de Flujo de Fondos */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Flujo de Fondos - Resumen</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Movimientos de Ingreso</div>
                <div className="text-2xl font-bold text-gray-900">
                  {flujoDeFondos?.filter(item => parseFloat(item.ingreso) > 0).length || 0}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Movimientos de Egreso</div>
                <div className="text-2xl font-bold text-gray-900">
                  {flujoDeFondos?.filter(item => parseFloat(item.egreso) > 0).length || 0}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Total Movimientos</div>
                <div className="text-2xl font-bold text-gray-900">
                  {flujoDeFondos?.length || 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}