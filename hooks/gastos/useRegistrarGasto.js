import toast from '@/components/shared/toast';
import { axiosAuth } from '@/utils/apiClient';
import { useGastosUIStore } from '@/stores/gastosUIStore';
import { useRegistrarGastoMutation } from '@/hooks/queries/finanzasQueries';
import { useInvalidateFinanzas } from '@/hooks/queries/useInvalidateQueries';

const obtenerMontoNumerico = (montoFormateado) => {
  if (!montoFormateado) return 0;
  let cleanValue = montoFormateado.toString();
  if (cleanValue.includes(',')) {
    cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
  } else {
    const parts = cleanValue.split('.');
    if (parts.length > 2 || (parts.length === 2 && parts[1].length > 2)) {
      cleanValue = cleanValue.replace(/\./g, '');
    }
  }
  const numericValue = parseFloat(cleanValue);
  return Number.isNaN(numericValue) ? 0 : numericValue;
};

export const useRegistrarGasto = () => {
  const setLoading = useGastosUIStore((s) => s.setLoading);
  const mutation = useRegistrarGastoMutation();
  const { invalidateCompras, invalidateFondos } = useInvalidateFinanzas();

  const subirComprobanteDirecto = async (gastoId, archivo) => {
    const maxSize = 10 * 1024 * 1024;
    if (archivo.size > maxSize) {
      throw new Error('El archivo es demasiado grande. Máximo 10MB permitido.');
    }
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(archivo.type)) {
      throw new Error('Tipo de archivo no válido. Solo se permiten: JPG, PNG, PDF, DOC, DOCX');
    }

    const formData = new FormData();
    formData.append('comprobante', archivo);

    const response = await axiosAuth.post(`/comprobantes/subir/gasto/${gastoId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    });

    return response.data?.success === true;
  };

  const registrarGasto = async (formData, archivo = null) => {
    setLoading({ operacion: true });
    try {
      if (!formData || typeof formData !== 'object') {
        toast.error('Datos del formulario inválidos');
        return false;
      }

      const gastoData = {
        descripcion: (formData.descripcion || '').trim(),
        monto: obtenerMontoNumerico(formData.monto),
        forma_pago: (formData.formaPago || '').trim(),
        observaciones: formData.observaciones
          ? (formData.observaciones || '').trim()
          : null,
        cuentaId: formData.cuentaId ? Number(formData.cuentaId) : null,
      };

      if (!gastoData.descripcion || !gastoData.forma_pago || gastoData.monto <= 0) {
        toast.error('Por favor complete todos los campos obligatorios correctamente');
        return false;
      }

      if (!gastoData.cuentaId) {
        toast.error('Debe seleccionar una cuenta de origen para el egreso');
        return false;
      }

      const response = await mutation.mutateAsync(gastoData);
      const gastoId = response.data?.id;

      if (!gastoId) {
        toast.error('Error: No se pudo obtener el ID del gasto creado');
        return false;
      }

      if (archivo) {
        try {
          const comprobanteSubido = await subirComprobanteDirecto(gastoId, archivo);
          toast.success(
            comprobanteSubido
              ? 'Gasto registrado exitosamente con comprobante'
              : 'Gasto registrado exitosamente, pero hubo un error al subir el comprobante'
          );
        } catch {
          toast.success(
            'Gasto registrado exitosamente, pero hubo un error al subir el comprobante'
          );
        }
      } else {
        toast.success('Gasto registrado exitosamente');
      }

      invalidateCompras();
      invalidateFondos();
      return true;
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Sesión expirada. Por favor, inicia sesión nuevamente');
      } else {
        toast.error(error.message || 'Error al registrar el gasto');
      }
      return false;
    } finally {
      setLoading({ operacion: false });
    }
  };

  return {
    registrarGasto,
    loading: mutation.isPending,
    subirComprobanteDirecto,
    obtenerMontoNumerico,
  };
};
