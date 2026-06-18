import { useState, useEffect, useRef, useCallback } from 'react';
import { MdFilterList, MdClear, MdExpandMore, MdSearch } from 'react-icons/md';
import { axiosAuth } from '@/utils/apiClient';
import { usePedidosUIStore } from '@/stores/pedidosUIStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import ModalBase from '@/components/common/ModalBase';

const DEBOUNCE_MS = 350;

function AutocompleteFiltroPedidos({ tipo, value, onChange, placeholder, ariaLabel }) {
  const [sugerencias, setSugerencias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const debounceRef = useRef(null);

  const buscar = useCallback(
    async (q) => {
      const trimmed = (q || '').trim();
      if (!trimmed) {
        setSugerencias([]);
        setAbierto(false);
        return;
      }
      setLoading(true);
      try {
        const params = new URLSearchParams({ tipo, q: trimmed });
        const res = await axiosAuth.get(`/pedidos/sugerencias-filtros?${params.toString()}`);
        if (res.data?.success && Array.isArray(res.data.data)) {
          setSugerencias(res.data.data);
          setAbierto(true);
        } else {
          setSugerencias([]);
        }
      } catch (err) {
        console.error('Error sugerencias filtros pedidos:', err);
        setSugerencias([]);
      } finally {
        setLoading(false);
      }
    },
    [tipo]
  );

  useEffect(() => () => debounceRef.current && clearTimeout(debounceRef.current), []);

  const handleChange = (e) => {
    const v = e.target.value;
    onChange(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (v.trim() === '') {
      setSugerencias([]);
      setAbierto(false);
      return;
    }
    debounceRef.current = setTimeout(() => buscar(v), DEBOUNCE_MS);
  };

  const handleFocus = () => {
    if (value?.trim()) buscar(value);
  };

  const handleBlur = () => setTimeout(() => setAbierto(false), 180);

  const handleSelect = (item) => {
    onChange(item);
    setAbierto(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Input
          type="text"
          value={value || ''}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          aria-label={ariaLabel}
          aria-autocomplete="list"
          aria-expanded={abierto}
          className="pl-10"
        />
        <MdSearch
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={20}
        />
      </div>
      {abierto && (
        <div
          className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border bg-popover shadow-lg"
          role="listbox"
        >
          {loading ? (
            <div className="p-3 text-sm text-muted-foreground">Buscando...</div>
          ) : sugerencias.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground">
              Sin resultados. Escribí y aplicá filtro.
            </div>
          ) : (
            sugerencias.map((item, i) => (
              <button
                key={i}
                type="button"
                role="option"
                className="w-full border-b px-3 py-2.5 text-left text-sm last:border-0 hover:bg-muted/50"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(item);
                }}
              >
                {item}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function FiltrosHistorialPedidos({
  filtros,
  onFiltrosChange,
  onLimpiarFiltros,
  user,
  totalPedidos = 0,
  pedidosFiltrados = 0,
}) {
  const { modalFiltros, openModalFiltros, closeModalFiltros } = usePedidosUIStore();
  const [localFiltros, setLocalFiltros] = useState(() => ({ ...filtros }));
  const [empleadosUnicos, setEmpleadosUnicos] = useState([]);
  const [loadingDatos, setLoadingDatos] = useState(false);
  const datosCargadosRef = useRef(false);

  const esGerente = user?.rol === 'GERENTE';

  useEffect(() => {
    setLocalFiltros({ ...filtros });
  }, [filtros]);

  useEffect(() => {
    if (!modalFiltros) {
      datosCargadosRef.current = false;
      return;
    }
    if (datosCargadosRef.current) return;
    datosCargadosRef.current = true;
    setLoadingDatos(true);
    axiosAuth
      .get('/pedidos/datos-filtros')
      .then((res) => {
        if (res.data?.success && res.data.data) {
          setEmpleadosUnicos(res.data.data.empleados ?? []);
        }
      })
      .catch((err) => console.error('Error cargando datos filtros pedidos:', err))
      .finally(() => setLoadingDatos(false));
  }, [modalFiltros]);

  const handleFiltroChange = (campo, valor) => {
    setLocalFiltros((prev) => ({ ...prev, [campo]: valor }));
  };

  const hayFiltrosActivos = (source) =>
    Object.values(source).some((valor) => valor && valor !== '');

  const contarFiltrosActivos = (source) =>
    Object.values(source).filter((valor) => valor && valor !== '').length;

  const aplicarFiltros = () => {
    onFiltrosChange({ ...localFiltros });
  };

  const aplicarYCerrarModal = () => {
    aplicarFiltros();
    closeModalFiltros();
  };

  const limpiarYCerrarModal = () => {
    onLimpiarFiltros();
    closeModalFiltros();
  };

  const cerrarSinAplicar = () => {
    setLocalFiltros({ ...filtros });
    closeModalFiltros();
  };

  const etiquetas = {
    fechaDesde: 'Desde',
    fechaHasta: 'Hasta',
    cliente: 'Cliente',
    ciudad: 'Ciudad',
    estado: 'Estado',
    empleado: 'Empleado',
  };

  const contenidoFiltros = (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Completá los criterios y hacé clic en <strong>Filtrar</strong> para buscar.
      </p>
      <p
        className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"
        role="note"
      >
        Al aplicar o limpiar filtros, la selección de pedidos se reinicia.
      </p>

      <div className="space-y-2">
        <Label>Cliente</Label>
        <AutocompleteFiltroPedidos
          tipo="cliente"
          value={localFiltros.cliente || ''}
          onChange={(v) => handleFiltroChange('cliente', v)}
          placeholder="Buscar cliente (en todo el historial)..."
          ariaLabel="Cliente"
        />
      </div>

      <div className="space-y-2">
        <Label>Estado</Label>
        <Select
          value={localFiltros.estado || 'todos'}
          onValueChange={(v) => handleFiltroChange('estado', v === 'todos' ? '' : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="Exportado">Exportado</SelectItem>
            <SelectItem value="Facturado">Facturado</SelectItem>
            <SelectItem value="Anulado">Anulado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Ciudad</Label>
        <AutocompleteFiltroPedidos
          tipo="ciudad"
          value={localFiltros.ciudad || ''}
          onChange={(v) => handleFiltroChange('ciudad', v)}
          placeholder="Buscar ciudad (en todo el historial)..."
          ariaLabel="Ciudad"
        />
      </div>

      {esGerente && (
        <div className="space-y-2">
          <Label>Empleado</Label>
          <Select
            value={localFiltros.empleado || 'todos'}
            onValueChange={(v) => handleFiltroChange('empleado', v === 'todos' ? '' : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos los empleados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los empleados</SelectItem>
              {empleadosUnicos.map((empleado, i) => (
                <SelectItem key={i} value={empleado}>
                  {empleado}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {loadingDatos && (
            <p className="text-xs text-muted-foreground">Cargando empleados...</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label>Fecha</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          <Input
            type="date"
            value={localFiltros.fechaDesde || ''}
            onChange={(e) => handleFiltroChange('fechaDesde', e.target.value)}
            title="Desde"
          />
          <Input
            type="date"
            value={localFiltros.fechaHasta || ''}
            onChange={(e) => handleFiltroChange('fechaHasta', e.target.value)}
            title="Hasta"
          />
        </div>
      </div>

      {hayFiltrosActivos(localFiltros) && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
          <span className="text-sm font-medium">Filtros en borrador:</span>
          <div className="mt-2 flex flex-wrap gap-1">
            {Object.entries(localFiltros).map(([campo, valor]) => {
              if (!valor) return null;
              return (
                <Badge key={campo} variant="outline" className="gap-1">
                  <strong>{etiquetas[campo] || campo}:</strong> {valor}
                  <button
                    type="button"
                    onClick={() => handleFiltroChange(campo, '')}
                    className="ml-1 hover:text-destructive"
                    aria-label={`Quitar filtro ${etiquetas[campo] || campo}`}
                  >
                    ×
                  </button>
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col flex-wrap gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button type="button" onClick={aplicarYCerrarModal}>
          <MdSearch size={16} />
          Filtrar
        </Button>
        {hayFiltrosActivos(localFiltros) && (
          <Button type="button" variant="danger" onClick={limpiarYCerrarModal}>
            <MdClear size={16} />
            Limpiar Filtros
          </Button>
        )}
        <Button type="button" variant="secondary" onClick={cerrarSinAplicar}>
          Cerrar
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <Card className="mb-4 shadow-sm">
        <CardContent className="p-0">
          <button
            type="button"
            className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-muted/30"
            onClick={openModalFiltros}
            aria-expanded={modalFiltros}
            aria-haspopup="dialog"
            aria-label="Abrir filtros de búsqueda"
          >
            <div className="flex min-w-0 items-center gap-3">
              <MdFilterList className="shrink-0 text-primary" size={24} />
              <div className="min-w-0">
                <h3 className="font-semibold">Filtros de Búsqueda</h3>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span>
                    Mostrando {pedidosFiltrados} de {totalPedidos} pedidos
                  </span>
                  {hayFiltrosActivos(filtros) && (
                    <Badge variant="info">
                      {contarFiltrosActivos(filtros)} filtro
                      {contarFiltrosActivos(filtros) !== 1 ? 's' : ''} activo
                      {contarFiltrosActivos(filtros) !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {hayFiltrosActivos(filtros) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLimpiarFiltros();
                  }}
                  title="Limpiar todos los filtros"
                  aria-label="Limpiar filtros"
                >
                  <MdClear size={20} className="text-destructive" />
                </Button>
              )}
              <MdExpandMore size={24} className="text-muted-foreground" aria-hidden />
            </div>
          </button>
        </CardContent>
      </Card>

      <ModalBase
        isOpen={modalFiltros}
        onClose={cerrarSinAplicar}
        title="Filtros de Búsqueda"
        size="lg"
        closeOnOverlay={false}
        closeOnEscape
        panelClassName="mx-4 w-full max-w-lg sm:mx-auto max-h-[min(90dvh,90vh)] flex flex-col"
        contentClassName="overflow-y-auto flex-1 min-h-0"
      >
        {contenidoFiltros}
      </ModalBase>
    </>
  );
}
