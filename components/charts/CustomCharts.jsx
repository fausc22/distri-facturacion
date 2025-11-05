import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

// Paleta de colores moderna
const COLORS = {
  primary: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'],
  gradients: [
    'rgba(59, 130, 246, 0.8)',
    'rgba(16, 185, 129, 0.8)',
    'rgba(245, 158, 11, 0.8)',
    'rgba(239, 68, 68, 0.8)',
    'rgba(139, 92, 246, 0.8)'
  ]
};

// Componente Tooltip personalizado
const CustomTooltip = ({ active, payload, label, formatCurrency, formatPercentage }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-700">
              {entry.name}: {' '}
              <span className="font-semibold">
                {entry.name.toLowerCase().includes('porcentaje') || entry.name.toLowerCase().includes('margen') 
                  ? formatPercentage ? formatPercentage(entry.value) : `${entry.value}%`
                  : formatCurrency ? formatCurrency(entry.value) : entry.value
                }
              </span>
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Componente Tooltip para gráficos de torta
const PieTooltip = ({ active, payload, formatCurrency, formatPercentage }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="text-sm font-medium text-gray-900 mb-1">{data.name}</p>
        <p className="text-sm text-gray-700">
          Valor: <span className="font-semibold">{formatCurrency ? formatCurrency(data.value) : data.value}</span>
        </p>
        {data.payload.porcentaje && (
          <p className="text-sm text-gray-700">
            Porcentaje: <span className="font-semibold">{formatPercentage ? formatPercentage(data.payload.porcentaje) : `${data.payload.porcentaje}%`}</span>
          </p>
        )}
      </div>
    );
  }
  return null;
};

// Gráfico de barras personalizado
export function CustomBarChart({ 
  data, 
  xKey, 
  yKeys, 
  title, 
  height = 300,
  formatCurrency,
  formatPercentage,
  showLegend = true,
  loading = false,
  emptyMessage = "No hay datos disponibles"
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
        {title && <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>}
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">{emptyMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      {title && <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey={xKey} 
            tick={{ fontSize: 12 }}
            stroke="#666"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            stroke="#666"
          />
          <Tooltip 
            content={<CustomTooltip formatCurrency={formatCurrency} formatPercentage={formatPercentage} />}
          />
          {showLegend && <Legend />}
          {yKeys.map((key, index) => (
            <Bar 
              key={key.dataKey || key}
              dataKey={key.dataKey || key}
              name={key.name || key}
              fill={key.color || COLORS.primary[index % COLORS.primary.length]}
              radius={[2, 2, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Gráfico de líneas personalizado
export function CustomLineChart({ 
  data, 
  xKey, 
  yKeys, 
  title, 
  height = 300,
  formatCurrency,
  formatPercentage,
  showLegend = true,
  loading = false,
  emptyMessage = "No hay datos disponibles"
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
        {title && <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>}
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">{emptyMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      {title && <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey={xKey} 
            tick={{ fontSize: 12 }}
            stroke="#666"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            stroke="#666"
          />
          <Tooltip 
            content={<CustomTooltip formatCurrency={formatCurrency} formatPercentage={formatPercentage} />}
          />
          {showLegend && <Legend />}
          {yKeys.map((key, index) => (
            <Line 
              key={key.dataKey || key}
              type="monotone"
              dataKey={key.dataKey || key}
              name={key.name || key}
              stroke={key.color || COLORS.primary[index % COLORS.primary.length]}
              strokeWidth={2}
              dot={{ fill: key.color || COLORS.primary[index % COLORS.primary.length], strokeWidth: 2 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Gráfico de área personalizado
export function CustomAreaChart({ 
  data, 
  xKey, 
  yKeys, 
  title, 
  height = 300,
  formatCurrency,
  formatPercentage,
  showLegend = true,
  loading = false,
  emptyMessage = "No hay datos disponibles"
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
        {title && <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>}
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">{emptyMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      {title && <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <defs>
            {yKeys.map((key, index) => (
              <linearGradient key={key.dataKey || key} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={key.color || COLORS.primary[index % COLORS.primary.length]} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={key.color || COLORS.primary[index % COLORS.primary.length]} stopOpacity={0.1}/>
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey={xKey} 
            tick={{ fontSize: 12 }}
            stroke="#666"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            stroke="#666"
          />
          <Tooltip 
            content={<CustomTooltip formatCurrency={formatCurrency} formatPercentage={formatPercentage} />}
          />
          {showLegend && <Legend />}
          {yKeys.map((key, index) => (
            <Area
              key={key.dataKey || key}
              type="monotone"
              dataKey={key.dataKey || key}
              name={key.name || key}
              stroke={key.color || COLORS.primary[index % COLORS.primary.length]}
              fill={`url(#gradient-${index})`}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Gráfico de torta personalizado
export function CustomPieChart({ 
  data, 
  nameKey, 
  valueKey, 
  title, 
  height = 300,
  formatCurrency,
  formatPercentage,
  showLegend = true,
  loading = false,
  emptyMessage = "No hay datos disponibles",
  showPercentage = true
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded-full mx-auto" style={{ width: height }}></div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
        {title && <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>}
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">{emptyMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  // Calcular total para porcentajes
  const total = data.reduce((sum, item) => sum + (parseFloat(item[valueKey]) || 0), 0);
  
  // Agregar porcentajes a los datos
  const dataWithPercentage = data.map(item => ({
    ...item,
    porcentaje: total > 0 ? ((parseFloat(item[valueKey]) || 0) / total * 100).toFixed(1) : 0
  }));

  const renderLabel = ({ name, value, porcentaje }) => {
    if (!showPercentage) return `${name}`;
    return `${name}: ${porcentaje}%`;
  };

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      {title && <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={dataWithPercentage}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey={valueKey}
            nameKey={nameKey}
          >
            {dataWithPercentage.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS.primary[index % COLORS.primary.length]} />
            ))}
          </Pie>
          <Tooltip 
            content={<PieTooltip formatCurrency={formatCurrency} formatPercentage={formatPercentage} />}
          />
          {showLegend && <Legend />}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// Gráfico de barras horizontal
export function HorizontalBarChart({ 
  data, 
  xKey, 
  yKey, 
  title, 
  height = 300,
  formatCurrency,
  maxItems = 10,
  loading = false,
  emptyMessage = "No hay datos disponibles"
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const limitedData = data ? data.slice(0, maxItems) : [];

  if (!limitedData || limitedData.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
        {title && <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>}
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">{emptyMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      {title && (
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          {data && data.length > maxItems && (
            <span className="text-sm text-gray-500">
              Mostrando top {maxItems} de {data.length}
            </span>
          )}
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          layout="horizontal"
          data={limitedData}
          margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            type="number"
            tick={{ fontSize: 12 }}
            stroke="#666"
          />
          <YAxis 
            type="category"
            dataKey={xKey}
            tick={{ fontSize: 12 }}
            stroke="#666"
            width={120}
          />
          <Tooltip 
            content={<CustomTooltip formatCurrency={formatCurrency} />}
          />
          <Bar dataKey={yKey} fill={COLORS.primary[0]} radius={[0, 2, 2, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}