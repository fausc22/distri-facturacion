import { useConsultaComercialQuery } from './queries/finanzasQueries';
import { usePeriodoReportes } from './usePeriodoReportes';

export function useConsultaComercial({ productoId, clienteId, vendedor, pagina = 1, porPagina = 50 } = {}) {
  const { rango, etiquetaPeriodo } = usePeriodoReportes();
  const filtros = {
    desde: rango.desde,
    hasta: rango.hasta,
    producto_id: productoId || '',
    cliente_id: clienteId || '',
    vendedor: vendedor || '',
    pagina,
    porPagina,
  };
  const query = useConsultaComercialQuery(filtros, Boolean(rango.desde && rango.hasta));

  return {
    data: query.data ?? null,
    loading: query.isFetching,
    error: query.error?.message || null,
    recargar: () => query.refetch(),
    etiquetaPeriodo,
    rango,
  };
}

export default useConsultaComercial;
