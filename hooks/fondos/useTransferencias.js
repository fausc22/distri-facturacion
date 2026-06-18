import { useState } from 'react';
import toast from '@/components/shared/toast';
import { useFondosUIStore } from '@/stores/fondosUIStore';
import { useTransferenciaMutation } from '@/hooks/queries/finanzasQueries';
import { useInvalidateFinanzas } from '@/hooks/queries/useInvalidateQueries';

export function useTransferencias() {
  const { setLoading } = useFondosUIStore();
  const { invalidateFondos } = useInvalidateFinanzas();
  const transferenciaMutation = useTransferenciaMutation();

  const [formData, setFormData] = useState({
    cuenta_origen: '',
    cuenta_destino: '',
    monto: 0,
    descripcion: '',
  });

  const realizarTransferencia = async () => {
    if (!formData.cuenta_origen || !formData.cuenta_destino) {
      toast.error('Debe seleccionar ambas cuentas');
      return false;
    }
    if (formData.cuenta_origen === formData.cuenta_destino) {
      toast.error('Las cuentas de origen y destino deben ser diferentes');
      return false;
    }
    if (formData.monto <= 0) {
      toast.error('El monto debe ser mayor a cero');
      return false;
    }
    setLoading({ operacion: true });
    try {
      await transferenciaMutation.mutateAsync(formData);
      toast.success('Transferencia realizada exitosamente');
      invalidateFondos();
      resetForm();
      return true;
    } catch (error) {
      toast.error(error.message || 'No se pudo realizar la transferencia');
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

  const resetForm = () => {
    setFormData({
      cuenta_origen: '',
      cuenta_destino: '',
      monto: 0,
      descripcion: '',
    });
  };

  const precargarCuentaOrigen = (cuentaId) => {
    setFormData((prev) => ({ ...prev, cuenta_origen: cuentaId }));
  };

  return {
    formData,
    realizarTransferencia,
    handleInputChange,
    resetForm,
    precargarCuentaOrigen,
  };
}
