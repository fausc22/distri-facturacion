import { useState } from 'react';
import toast from '@/components/shared/toast';
import { useIngresosUIStore } from '@/stores/ingresosUIStore';
import { useInvalidateFinanzas } from '@/hooks/queries/useInvalidateQueries';
import { axiosAuth } from '../../utils/apiClient';

export function useNuevoIngreso() {
  const { setModal, setLoading } = useIngresosUIStore();
  const { invalidateIngresos } = useInvalidateFinanzas();

  const [formData, setFormData] = useState({
    cuenta_id: '',
    monto: '',
    origen: 'ingreso manual',
    descripcion: '',
  });

  const resetForm = () => {
    setFormData({
      cuenta_id: '',
      monto: '',
      origen: 'ingreso manual',
      descripcion: '',
    });
  };

  const registrarIngreso = async () => {
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
      const response = await axiosAuth.post('/finanzas/ingresos/registrar', formData);

      if (response.data.success) {
        toast.success('Ingreso registrado exitosamente');
        resetForm();
        setModal('nuevoIngreso', false);
        invalidateIngresos();
        return true;
      }

      toast.error(response.data.message || 'Error al registrar el ingreso');
      return false;
    } catch (error) {
      console.error('Error al registrar ingreso:', error);
      toast.error('No se pudo registrar el ingreso');
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
    setModal('nuevoIngreso', true);
  };

  const cerrarModal = () => {
    resetForm();
    setModal('nuevoIngreso', false);
  };

  return {
    formData,
    registrarIngreso,
    handleInputChange,
    resetForm,
    abrirModal,
    cerrarModal,
  };
}
