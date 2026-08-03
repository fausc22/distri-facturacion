import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const selectClass =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

export default function FiltrosMovimientos({
  cuentas,
  filtros,
  onFiltroChange,
  onAplicarFiltros,
  onLimpiarFiltros,
}) {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onFiltroChange(name, value);
  };

  return (
    <Card className="mb-6 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Filtros de búsqueda</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>Cuenta</Label>
            <select
              name="cuenta_id"
              className={selectClass}
              value={filtros.cuenta_id}
              onChange={handleInputChange}
            >
              <option value="todas">Todas las cuentas</option>
              {cuentas.map((cuenta) => (
                <option key={cuenta.id} value={cuenta.id}>
                  {cuenta.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Tipo</Label>
            <select
              name="tipo"
              className={selectClass}
              value={filtros.tipo}
              onChange={handleInputChange}
            >
              <option value="todos">Todos</option>
              <option value="INGRESO">Ingresos</option>
              <option value="EGRESO">Egresos</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Desde</Label>
            <Input type="date" name="desde" value={filtros.desde} onChange={handleInputChange} />
          </div>

          <div className="space-y-2">
            <Label>Hasta</Label>
            <Input type="date" name="hasta" value={filtros.hasta} onChange={handleInputChange} />
          </div>
        </div>

        <div className="flex gap-2">
          <Input
            type="text"
            name="busqueda"
            placeholder="Buscar por origen o descripción..."
            className="flex-1"
            value={filtros.busqueda}
            onChange={handleInputChange}
          />
          <Button type="button" onClick={onAplicarFiltros}>
            Buscar
          </Button>
        </div>

        <div className="text-right">
          <Button type="button" variant="link" className="h-auto p-0" onClick={onLimpiarFiltros}>
            Limpiar filtros
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
