import { useState, useEffect } from 'react';
import toast from '@/components/shared/toast';
import { useFondosUIStore } from '@/stores/fondosUIStore';
import {
  useFondosMovimientosQuery,
  useRegistrarMovimientoMutation,
} from '@/hooks/queries/finanzasQueries';
import { useInvalidateFinanzas } from '@/hooks/queries/useInvalidateQueries';

export function useMovimientos() {
  const { filtros, setFiltros, resetFiltros, setLoading } = useFondosUIStore();
  const { invalidateFondos } = useInvalidateFinanzas();

  const [formData, setFormData] = useState({
    cuenta_id: '',
    tipo: 'INGRESO',
    origen: 'ingreso manual',
    monto: 0,
    descripcion: '',
  });

  const query = useFondosMovimientosQuery(filtros);
  const registrarMutation = useRegistrarMovimientoMutation();

  useEffect(() => {
    setLoading({ movimientos: query.isLoading });
  }, [query.isLoading, setLoading]);

  const movimientos = query.data ?? [];

  const cargarMovimientos = () => query.refetch();

  const registrarMovimiento = async () => {
    if (!formData.cuenta_id) {
      toast.error('Debe seleccionar una cuenta');
      return false;
    }
    if (formData.monto <= 0) {
      toast.error('El monto debe ser mayor a cero');
      return false;
    }
    setLoading({ operacion: true });
    try {
      await registrarMutation.mutateAsync(formData);
      toast.success(
        `${formData.tipo === 'INGRESO' ? 'Ingreso' : 'Egreso'} registrado exitosamente`
      );
      invalidateFondos();
      resetForm();
      return true;
    } catch (error) {
      toast.error(error.message || 'No se pudo registrar el movimiento');
      return false;
    } finally {
      setLoading({ operacion: false });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'monto' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleFiltroChange = (name, value) => setFiltros({ [name]: value });

  const aplicarFiltros = () => query.refetch();

  const limpiarFiltros = () => {
    resetFiltros();
  };

  const resetForm = () => {
    setFormData({
      cuenta_id: '',
      tipo: 'INGRESO',
      origen: 'ingreso manual',
      monto: 0,
      descripcion: '',
    });
  };

  const precargarFormulario = (cuentaId, tipo) => {
    setFormData((prev) => ({
      ...prev,
      cuenta_id: cuentaId,
      tipo,
      origen: tipo === 'INGRESO' ? 'ingreso manual' : 'gasto manual',
    }));
  };

  return {
    movimientos,
    formData,
    filtros,
    loading: query.isLoading,
    cargarMovimientos,
    registrarMovimiento,
    handleInputChange,
    handleFiltroChange,
    aplicarFiltros,
    limpiarFiltros,
    resetForm,
    precargarFormulario,
  };
}
