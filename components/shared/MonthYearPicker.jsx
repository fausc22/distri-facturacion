import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export const MESES = [
  { value: '1', label: 'Enero' },
  { value: '2', label: 'Febrero' },
  { value: '3', label: 'Marzo' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Mayo' },
  { value: '6', label: 'Junio' },
  { value: '7', label: 'Julio' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
];

export function getAniosOptions(cantidad = 5) {
  const anioActual = new Date().getFullYear();
  return Array.from({ length: cantidad }, (_, i) => String(anioActual - i));
}

/**
 * Selector reutilizable de mes y año.
 */
export function MonthYearPicker({
  mes,
  anio,
  onMesChange,
  onAnioChange,
  mesLabel = 'Mes',
  anioLabel = 'Año',
  className,
  disabled = false,
  aniosCantidad = 5,
}) {
  const anios = getAniosOptions(aniosCantidad);

  return (
    <div className={cn('grid gap-4 sm:grid-cols-2', className)}>
      <div className="space-y-2">
        <Label>{mesLabel}</Label>
        <Select value={mes || ''} onValueChange={onMesChange} disabled={disabled}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccione un mes" />
          </SelectTrigger>
          <SelectContent>
            {MESES.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{anioLabel}</Label>
        <Select value={anio || ''} onValueChange={onAnioChange} disabled={disabled}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccione un año" />
          </SelectTrigger>
          <SelectContent>
            {anios.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export default MonthYearPicker;
