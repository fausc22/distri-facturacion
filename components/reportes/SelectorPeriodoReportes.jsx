import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
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
          {onRecargar && (
            <Button type="button" variant="outline" size="sm" onClick={onRecargar} disabled={loading}>
              {loading ? 'Cargando...' : 'Recargar'}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {modo === 'mes' ? (
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
