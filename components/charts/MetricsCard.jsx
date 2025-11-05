import { useState } from 'react';

export function MetricsCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  trendValue, 
  color = 'blue',
  loading = false,
  onClick,
  className = '',
  size = 'normal'
}) {
  const [isHovered, setIsHovered] = useState(false);

  // Configuración de colores
  const colorConfig = {
    blue: {
      bg: 'bg-blue-500',
      bgLight: 'bg-blue-50',
      text: 'text-blue-600',
      textDark: 'text-blue-800',
      border: 'border-blue-200',
      iconBg: 'bg-blue-100'
    },
    green: {
      bg: 'bg-green-500',
      bgLight: 'bg-green-50',
      text: 'text-green-600',
      textDark: 'text-green-800',
      border: 'border-green-200',
      iconBg: 'bg-green-100'
    },
    red: {
      bg: 'bg-red-500',
      bgLight: 'bg-red-50',
      text: 'text-red-600',
      textDark: 'text-red-800',
      border: 'border-red-200',
      iconBg: 'bg-red-100'
    },
    yellow: {
      bg: 'bg-yellow-500',
      bgLight: 'bg-yellow-50',
      text: 'text-yellow-600',
      textDark: 'text-yellow-800',
      border: 'border-yellow-200',
      iconBg: 'bg-yellow-100'
    },
    purple: {
      bg: 'bg-purple-500',
      bgLight: 'bg-purple-50',
      text: 'text-purple-600',
      textDark: 'text-purple-800',
      border: 'border-purple-200',
      iconBg: 'bg-purple-100'
    },
    gray: {
      bg: 'bg-gray-500',
      bgLight: 'bg-gray-50',
      text: 'text-gray-600',
      textDark: 'text-gray-800',
      border: 'border-gray-200',
      iconBg: 'bg-gray-100'
    }
  };

  const colors = colorConfig[color] || colorConfig.blue;

  // Configuración de tamaños
  const sizeConfig = {
    small: {
      container: 'p-3',
      iconContainer: 'w-8 h-8',
      iconSize: 'w-4 h-4',
      title: 'text-xs',
      value: 'text-lg',
      subtitle: 'text-xs'
    },
    normal: {
      container: 'p-4',
      iconContainer: 'w-10 h-10',
      iconSize: 'w-5 h-5',
      title: 'text-sm',
      value: 'text-2xl',
      subtitle: 'text-sm'
    },
    large: {
      container: 'p-6',
      iconContainer: 'w-12 h-12',
      iconSize: 'w-6 h-6',
      title: 'text-base',
      value: 'text-3xl',
      subtitle: 'text-base'
    }
  };

  const sizing = sizeConfig[size] || sizeConfig.normal;

  // Determinar el color del trend
  const getTrendColor = () => {
    if (!trend || !trendValue) return 'text-gray-500';
    
    if (trend === 'up') {
      return 'text-green-600';
    } else if (trend === 'down') {
      return 'text-red-600';
    }
    return 'text-gray-500';
  };

  // Icono del trend
  const TrendIcon = () => {
    if (!trend) return null;
    
    if (trend === 'up') {
      return (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      );
    } else if (trend === 'down') {
      return (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${sizing.container} ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-3">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className={`${sizing.iconContainer} bg-gray-200 rounded-lg`}></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`
        bg-white rounded-lg shadow-sm border border-gray-200 
        transition-all duration-200 
        ${onClick ? 'cursor-pointer hover:shadow-md hover:border-gray-300' : ''} 
        ${isHovered && onClick ? 'transform hover:scale-105' : ''}
        ${sizing.container} 
        ${className}
      `}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header con título e icono */}
      <div className="flex items-center justify-between mb-3">
        <h3 className={`font-medium text-gray-700 ${sizing.title}`}>
          {title}
        </h3>
        {icon && (
          <div className={`${sizing.iconContainer} ${colors.iconBg} rounded-lg flex items-center justify-center`}>
            <div className={`${colors.text} ${sizing.iconSize}`}>
              {icon}
            </div>
          </div>
        )}
      </div>

      {/* Valor principal */}
      <div className={`font-bold ${colors.textDark} ${sizing.value} mb-1`}>
        {value || '—'}
      </div>

      {/* Subtitle y trend */}
      <div className="flex items-center justify-between">
        {subtitle && (
          <p className={`text-gray-600 ${sizing.subtitle}`}>
            {subtitle}
          </p>
        )}
        
        {trend && trendValue && (
          <div className={`flex items-center space-x-1 ${getTrendColor()}`}>
            <TrendIcon />
            <span className="text-xs font-medium">
              {trendValue}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente especializado para KPIs financieros
export function FinancialMetricsCard({ 
  title, 
  value, 
  previousValue, 
  formatCurrency,
  showChange = true,
  ...props 
}) {
  // Calcular trend automáticamente
  const calculateTrend = () => {
    if (!showChange || !previousValue || previousValue === 0) {
      return { trend: null, trendValue: null };
    }

    const current = parseFloat(value) || 0;
    const previous = parseFloat(previousValue) || 0;
    
    if (current === previous) {
      return { trend: 'neutral', trendValue: '0%' };
    }

    const changePercent = ((current - previous) / previous) * 100;
    const trend = changePercent > 0 ? 'up' : 'down';
    const trendValue = `${Math.abs(changePercent).toFixed(1)}%`;

    return { trend, trendValue };
  };

  const { trend, trendValue } = calculateTrend();
  const formattedValue = formatCurrency ? formatCurrency(value) : value;

  return (
    <MetricsCard
      title={title}
      value={formattedValue}
      trend={trend}
      trendValue={trendValue}
      {...props}
    />
  );
}

// Componente para métricas de porcentaje
export function PercentageMetricsCard({ 
  title, 
  value, 
  previousValue, 
  showChange = true,
  ...props 
}) {
  const calculateTrend = () => {
    if (!showChange || !previousValue) {
      return { trend: null, trendValue: null };
    }

    const current = parseFloat(value) || 0;
    const previous = parseFloat(previousValue) || 0;
    
    if (current === previous) {
      return { trend: 'neutral', trendValue: '0pp' };
    }

    const changePoints = current - previous;
    const trend = changePoints > 0 ? 'up' : 'down';
    const trendValue = `${Math.abs(changePoints).toFixed(1)}pp`;

    return { trend, trendValue };
  };

  const { trend, trendValue } = calculateTrend();
  const formattedValue = value ? `${parseFloat(value).toFixed(1)}%` : '0%';

  return (
    <MetricsCard
      title={title}
      value={formattedValue}
      trend={trend}
      trendValue={trendValue}
      {...props}
    />
  );
}

// Grid de métricas responsivo
export function MetricsGrid({ children, columns = 4, className = '' }) {
  const getGridClass = () => {
    switch (columns) {
      case 2:
        return 'grid-cols-1 md:grid-cols-2';
      case 3:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case 4:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
      case 5:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5';
      default:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    }
  };

  return (
    <div className={`grid ${getGridClass()} gap-4 ${className}`}>
      {children}
    </div>
  );
}