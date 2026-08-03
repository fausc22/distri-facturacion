import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useReportesContext } from '../../context/ReportesContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export function ReportesFiltros({ onFiltrosChange, empleados = [], ciudades = [] }) {
  const {
    filtros,
    updateFiltros,
    limpiarFiltros,
    setPeriodoPredefinido,
    periodosPredefinidos,
    mostrarFiltros,
    setMostrarFiltros,
    formatearPeriodo,
    diasEnPeriodo,
    finanzasApi,
  } = useReportesContext();

  const [filtrosLocales, setFiltrosLocales] = useState(filtros);
  const [cuentasDisponibles, setCuentasDisponibles] = useState([]);

  useEffect(() => {
    setFiltrosLocales(filtros);
  }, [filtros]);

  useEffect(() => {
    const cargarCuentas = async () => {
      try {
        const response = await finanzasApi.obtenerBalancePorCuenta({
          desde: filtros.desde,
          hasta: filtros.hasta,
        });
        if (response?.success && Array.isArray(response.data)) {
          const cuentas = response.data.map((c) => c.cuenta).filter(Boolean);
          setCuentasDisponibles([...new Set(cuentas)]);
        }
      } catch {
        // noop
      }
    };
    cargarCuentas();
  }, [finanzasApi, filtros.desde, filtros.hasta]);

  const aplicarFiltros = () => {
    const fechaDesde = new Date(filtrosLocales.desde);
    const fechaHasta = new Date(filtrosLocales.hasta);
    if (isNaN(fechaDesde.getTime()) || isNaN(fechaHasta.getTime()) || fechaDesde > fechaHasta) {
      return;
    }
    updateFiltros(filtrosLocales);
    onFiltrosChange?.(filtrosLocales);
  };

  const handleFiltroChange = (key, value) => {
    setFiltrosLocales((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Card>
      <CardHeader className="border-b px-4 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className="flex items-center gap-2 text-sm font-medium text-foreground hover:opacity-80"
            >
              <ChevronDown
                className={cn('h-4 w-4 transition-transform', mostrarFiltros && 'rotate-180')}
              />
              Filtros y Período
            </button>
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {formatearPeriodo} ({diasEnPeriodo} días)
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={limpiarFiltros}>
              Limpiar
            </Button>
            <Button type="button" size="sm" onClick={aplicarFiltros}>
              Aplicar
            </Button>
          </div>
        </div>
      </CardHeader>

      {mostrarFiltros && (
        <CardContent className="space-y-4 pt-4">
          <div>
            <Label className="mb-2 block">Períodos Rápidos</Label>
            <div className="flex flex-wrap gap-2">
              {periodosPredefinidos.map((periodo) => (
                <Button
                  key={periodo.key}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPeriodoPredefinido(periodo.key)}
                >
                  {periodo.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="filtro-desde">Fecha Desde</Label>
              <Input
                id="filtro-desde"
                type="date"
                value={filtrosLocales.desde}
                onChange={(e) => handleFiltroChange('desde', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="filtro-hasta">Fecha Hasta</Label>
              <Input
                id="filtro-hasta"
                type="date"
                value={filtrosLocales.hasta}
                onChange={(e) => handleFiltroChange('hasta', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Período</Label>
              <Select
                value={filtrosLocales.periodo}
                onValueChange={(value) => handleFiltroChange('periodo', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diario">Diario</SelectItem>
                  <SelectItem value="mensual">Mensual</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {empleados.length > 0 && (
              <div className="space-y-1">
                <Label>Empleado</Label>
                <Select
                  value={filtrosLocales.empleado_id || 'todos'}
                  onValueChange={(value) =>
                    handleFiltroChange('empleado_id', value === 'todos' ? '' : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los empleados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los empleados</SelectItem>
                    {empleados.map((empleado) => (
                      <SelectItem key={empleado.id} value={String(empleado.id)}>
                        {empleado.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {ciudades.length > 0 && (
              <div className="space-y-1">
                <Label>Ciudad</Label>
                <Select
                  value={filtrosLocales.ciudad || 'todas'}
                  onValueChange={(value) =>
                    handleFiltroChange('ciudad', value === 'todas' ? '' : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las ciudades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas las ciudades</SelectItem>
                    {ciudades.map((ciudad, index) => (
                      <SelectItem key={index} value={ciudad}>
                        {ciudad}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1">
              <Label>Límite de Resultados</Label>
              <Select
                value={String(filtrosLocales.limite)}
                onValueChange={(value) => handleFiltroChange('limite', parseInt(value, 10))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 resultados</SelectItem>
                  <SelectItem value="20">20 resultados</SelectItem>
                  <SelectItem value="50">50 resultados</SelectItem>
                  <SelectItem value="100">100 resultados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <Label>Cuenta</Label>
              <Select
                value={filtrosLocales.cuenta_id || 'todas'}
                onValueChange={(value) =>
                  handleFiltroChange('cuenta_id', value === 'todas' ? '' : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="1">ARCA</SelectItem>
                  <SelectItem value="2">X</SelectItem>
                  {cuentasDisponibles.map((cuenta) => (
                    <SelectItem key={cuenta} value={cuenta}>
                      {cuenta}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Tipo Fiscal</Label>
              <Select
                value={filtrosLocales.tipo_fiscal || 'todos'}
                onValueChange={(value) =>
                  handleFiltroChange('tipo_fiscal', value === 'todos' ? '' : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="X">X</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Comparativo</Label>
              <Select
                value={filtrosLocales.comparativo || 'periodo_anterior'}
                onValueChange={(value) => handleFiltroChange('comparativo', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="periodo_anterior">Vs período anterior</SelectItem>
                  <SelectItem value="anio_anterior">Vs mismo período año anterior</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md bg-muted/50 p-2 text-xs text-muted-foreground sm:hidden">
            <strong>Período:</strong> {formatearPeriodo}
            <br />
            <strong>Duración:</strong> {diasEnPeriodo} días
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export function FiltrosCompactos({ onPeriodoChange }) {
  const { setPeriodoPredefinido, periodosPredefinidos } = useReportesContext();

  const handlePeriodoClick = (periodo) => {
    setPeriodoPredefinido(periodo);
    onPeriodoChange?.(periodo);
  };

  return (
    <Card className="p-3">
      <div className="flex items-center gap-2 overflow-x-auto">
        <span className="whitespace-nowrap text-sm font-medium">Período:</span>
        <div className="flex gap-2">
          {periodosPredefinidos.slice(0, 4).map((periodo) => (
            <Button
              key={periodo.key}
              type="button"
              variant="secondary"
              size="sm"
              className="whitespace-nowrap text-xs"
              onClick={() => handlePeriodoClick(periodo.key)}
            >
              {periodo.label.replace('Último ', '').replace('Última ', '')}
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
}

export function IndicadoresFiltros() {
  const { filtros, limpiarFiltros, formatearPeriodo } = useReportesContext();

  const filtrosActivos = [];
  if (filtros.empleado_id) filtrosActivos.push({ key: 'empleado', label: 'Empleado específico' });
  if (filtros.ciudad) filtrosActivos.push({ key: 'ciudad', label: `Ciudad: ${filtros.ciudad}` });
  if (filtros.cuenta_id) {
    const cuentaLabel =
      filtros.cuenta_id === '1' ? 'ARCA' : filtros.cuenta_id === '2' ? 'X' : filtros.cuenta_id;
    filtrosActivos.push({ key: 'cuenta', label: `Cuenta: ${cuentaLabel}` });
  }
  if (filtros.tipo_fiscal) {
    filtrosActivos.push({ key: 'tipo_fiscal', label: `Tipo: ${filtros.tipo_fiscal}` });
  }

  if (filtrosActivos.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
      <span className="text-sm font-medium text-blue-800">Filtros activos:</span>
      {filtrosActivos.map((filtro) => (
        <Badge key={filtro.key} variant="info">
          {filtro.label}
        </Badge>
      ))}
      <span className="text-xs text-blue-600">{formatearPeriodo}</span>
      <Button
        type="button"
        variant="link"
        size="sm"
        className="h-auto p-0 text-xs text-blue-600"
        onClick={limpiarFiltros}
      >
        Limpiar todos
      </Button>
    </div>
  );
}
