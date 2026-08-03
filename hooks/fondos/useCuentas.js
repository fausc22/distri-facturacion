import { useState } from 'react';
import toast from '@/components/shared/toast';
import { useFondosUIStore } from '@/stores/fondosUIStore';
import { useFondosCuentasQuery, useCrearCuentaMutation } from '@/hooks/queries/finanzasQueries';
import { useInvalidateFinanzas } from '@/hooks/queries/useInvalidateQueries';

export function useCuentas() {
  const { setLoading } = useFondosUIStore();
  const { invalidateFondos } = useInvalidateFinanzas();
  const [formData, setFormData] = useState({ nombre: '', saldo: 0 });

  const query = useFondosCuentasQuery();
  const crearMutation = useCrearCuentaMutation();

  const cuentas = query.data ?? [];
  const totalSaldos = cuentas.reduce((acc, cuenta) => acc + parseFloat(cuenta.saldo || 0), 0);

  const cargarCuentas = () => query.refetch();

  const crearCuenta = async () => {
    if (!formData.nombre.trim()) {
      toast.error('El nombre de la cuenta es obligatorio');
      return false;
    }
    setLoading({ operacion: true });
    try {
      await crearMutation.mutateAsync(formData);
      toast.success('Cuenta creada exitosamente');
      invalidateFondos();
      resetForm();
      return true;
    } catch (error) {
      toast.error(error.message || 'No se pudo crear la cuenta');
      return false;
    } finally {
      setLoading({ operacion: false });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'saldo' ? parseFloat(value) || 0 : value,
    }));
  };

  const resetForm = () => setFormData({ nombre: '', saldo: 0 });

  return {
    cuentas,
    formData,
    totalSaldos,
    loading: query.isLoading,
    cargarCuentas,
    crearCuenta,
    handleInputChange,
    resetForm,
  };
}
