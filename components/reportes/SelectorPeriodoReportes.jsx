import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  rangoHoy,
  rangoSemanaActual,
  rangoSemanaPasada,
  rangoUltimos7Dias,
} from '@/stores/reportesUIStore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function SelectorPeriodoReportes({
  modo,
  setModo,
  seleccionMes,
  setSeleccionMes,
  seleccionRango,
  setSeleccionRango,
  seleccionDias,
  setSeleccionDias,
  meses,
  aniosDisponibles,
  etiquetaPeriodo,
  onRecargar,
  loading,
}) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 border-b sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm text-muted-foreground">Periodo del reporte</div>
          <div className="text-base font-semibold">{etiquetaPeriodo}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant={modo === 'mes' ? 'default' : 'outline'} size="sm" onClick={() => setModo('mes')}>
            Mes específico
          </Button>
          <Button type="button" variant={modo === 'rango' ? 'default' : 'outline'} size="sm" onClick={() => setModo('rango')}>
            Rango de meses
          </Button>
          <Button type="button" variant={modo === 'dias' ? 'default' : 'outline'} size="sm" onClick={() => setModo('dias')}>
            Por días
          </Button>
          {onRecargar && (
            <Button type="button" variant="outline" size="sm" onClick={onRecargar} disabled={loading}>
              {loading ? 'Cargando...' : 'Recargar'}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {modo === 'dias' ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setSeleccionDias(rangoHoy())}>
                Hoy
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setSeleccionDias(rangoSemanaActual())}>
                Esta semana
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setSeleccionDias(rangoSemanaPasada())}>
                Semana pasada
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setSeleccionDias(rangoUltimos7Dias())}>
                Últimos 7 días
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="reporte-desde">Desde</Label>
                <Input
                  id="reporte-desde"
                  type="date"
                  value={seleccionDias?.desde || ''}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    setSeleccionDias({ ...seleccionDias, desde: e.target.value });
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="reporte-hasta">Hasta</Label>
                <Input
                  id="reporte-hasta"
                  type="date"
                  value={seleccionDias?.hasta || ''}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    setSeleccionDias({ ...seleccionDias, hasta: e.target.value });
                  }}
                />
              </div>
            </div>
          </div>
        ) : modo === 'mes' ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Mes</Label>
              <Select
                value={String(seleccionMes.mes)}
                onValueChange={(v) => setSeleccionMes({ ...seleccionMes, mes: parseInt(v, 10) })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {meses.map((m) => (
                    <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Año</Label>
              <Select
                value={String(seleccionMes.anio)}
                onValueChange={(v) => setSeleccionMes({ ...seleccionMes, anio: parseInt(v, 10) })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {aniosDisponibles.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Rango entre meses
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>Desde - mes</Label>
                  <Select
                    value={String(seleccionRango.desdeMes)}
                    onValueChange={(v) => setSeleccionRango({ ...seleccionRango, desdeMes: parseInt(v, 10) })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {meses.map((m) => (<SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Año</Label>
                  <Select
                    value={String(seleccionRango.desdeAnio)}
                    onValueChange={(v) => setSeleccionRango({ ...seleccionRango, desdeAnio: parseInt(v, 10) })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {aniosDisponibles.map((y) => (<SelectItem key={y} value={String(y)}>{y}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>Hasta - mes</Label>
                  <Select
                    value={String(seleccionRango.hastaMes)}
                    onValueChange={(v) => setSeleccionRango({ ...seleccionRango, hastaMes: parseInt(v, 10) })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {meses.map((m) => (<SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Año</Label>
                  <Select
                    value={String(seleccionRango.hastaAnio)}
                    onValueChange={(v) => setSeleccionRango({ ...seleccionRango, hastaAnio: parseInt(v, 10) })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {aniosDisponibles.map((y) => (<SelectItem key={y} value={String(y)}>{y}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SelectorPeriodoReportes;
