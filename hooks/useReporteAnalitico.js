// Datos analíticos compartidos: reporte gerencial + balance financiero.
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { axiosAuth } from '../utils/apiClient';
import { usePeriodoReportes } from './usePeriodoReportes';

export function useReporteAnalitico({ incluirBalance = false } = {}) {
  const { rango, filtros, etiquetaPeriodo } = usePeriodoReportes();

  const [gerencial, setGerencial] = useState(null);
  const [balance, setBalance] = useState({
    general: null,
    porCuenta: null,
    flujo: null,
    totales: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    if (!rango.desde || !rango.hasta) return null;

    setLoading(true);
    setError(null);

    try {
      const promesas = [
        axiosAuth.get('/finanzas/reporte-gerencial', {
          params: { desde: rango.desde, hasta: rango.hasta },
        }),
      ];

      if (incluirBalance) {
        promesas.push(
          axiosAuth.get('/finanzas/balance-general', { params: { desde: rango.desde, hasta: rango.hasta } }),
          axiosAuth.get('/finanzas/balance-cuenta', { params: { desde: rango.desde, hasta: rango.hasta } }),
          axiosAuth.get('/finanzas/flujo-fondos', { params: { desde: rango.desde, hasta: rango.hasta } })
        );
      }

      const resultados = await Promise.allSettled(promesas);
      const gerencialRes = resultados[0];

      if (gerencialRes.status === 'fulfilled' && gerencialRes.value.data?.success) {
        setGerencial(gerencialRes.value.data.data);
      } else if (!incluirBalance) {
        const msg =
          gerencialRes.status === 'fulfilled'
            ? gerencialRes.value.data?.message
            : gerencialRes.reason?.response?.data?.message || 'Error al cargar datos de ventas';
        setError(msg || 'Error al cargar datos de ventas');
        setGerencial(null);
      } else {
        setGerencial(null);
      }

      if (incluirBalance) {
        const [, balanceRes, cuentasRes, flujoRes] = resultados;
        const balanceOk =
          balanceRes?.status === 'fulfilled' && balanceRes.value.data?.success;

        setBalance({
          general:
            balanceOk ? balanceRes.value.data.data : null,
          porCuenta:
            cuentasRes?.status === 'fulfilled' && cuentasRes.value.data?.success
              ? cuentasRes.value.data.data
              : null,
          flujo:
            flujoRes?.status === 'fulfilled' && flujoRes.value.data?.success
              ? flujoRes.value.data.data
              : null,
          totales: balanceOk ? balanceRes.value.data.totales : null,
        });

        if (!balanceOk) {
          const msg =
            balanceRes?.status === 'fulfilled'
              ? balanceRes.value.data?.message
              : balanceRes?.reason?.response?.data?.message || 'Error al cargar balance financiero';
          setError(msg || 'Error al cargar balance financiero');
        } else {
          setError(null);
        }
      }

      return gerencialRes.status === 'fulfilled' ? gerencialRes.value.data?.data : null;
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Error al cargar reportes';
      setError(msg);
      toast.error(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [rango.desde, rango.hasta, incluirBalance]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return {
    gerencial,
    balance,
    loading,
    error,
    rango,
    filtros,
    etiquetaPeriodo,
    recargar: cargar,
  };
}

export default useReporteAnalitico;
