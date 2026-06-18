import { useState } from 'react';
import toast from '@/components/shared/toast';
import { useEgresosUIStore } from '@/stores/egresosUIStore';
import { useInvalidateFinanzas } from '@/hooks/queries/useInvalidateQueries';
import { axiosAuth } from '../../utils/apiClient';

export function useNuevoEgreso() {
  const { setModal, setLoading } = useEgresosUIStore();
  const { invalidateEgresos } = useInvalidateFinanzas();

  const [formData, setFormData] = useState({
    cuenta_id: '',
    monto: '',
    origen: 'egreso manual',
    descripcion: '',
  });

  const resetForm = () => {
    setFormData({
      cuenta_id: '',
      monto: '',
      origen: 'egreso manual',
      descripcion: '',
    });
  };

  const registrarEgreso = async () => {
    if (!formData.cuenta_id) {
      toast.error('Debe seleccionar una cuenta');
      return false;
    }

    if (!formData.monto || parseFloat(formData.monto) <= 0) {
      toast.error('El monto debe ser mayor a cero');
      return false;
    }

    setLoading({ operacion: true });
    try {
      const response = await axiosAuth.post('/finanzas/egresos/registrar', formData);

      if (response.data.success) {
        toast.success('Egreso registrado exitosamente');
        resetForm();
        setModal('nuevoEgreso', false);
        invalidateEgresos();
        return true;
      }

      toast.error(response.data.message || 'Error al registrar el egreso');
      return false;
    } catch (error) {
      console.error('Error al registrar egreso:', error);
      toast.error('No se pudo registrar el egreso');
      return false;
    } finally {
      setLoading({ operacion: false });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const abrirModal = () => {
    resetForm();
    setModal('nuevoEgreso', true);
  };

  const cerrarModal = () => {
    resetForm();
    setModal('nuevoEgreso', false);
  };

  return {
    formData,
    registrarEgreso,
    handleInputChange,
    resetForm,
    abrirModal,
    cerrarModal,
  };
}
