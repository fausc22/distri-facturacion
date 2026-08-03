import { create } from 'zustand';

const initialFormData = {
  descripcion: '',
  monto: '',
  formaPago: '',
  observaciones: '',
  archivo: null,
  archivoPreview: null,
};

const formatMonto = (value) => {
  if (!value) return '';

  let numericString = value.toString().replace(/[^\d]/g, '');
  if (!numericString) return '';

  if (numericString.length > 10) {
    numericString = numericString.substring(0, 10);
  }

  let numero = parseInt(numericString, 10);
  if (numero > 9999999999) {
    numero = 9999999999;
    numericString = numero.toString();
  }

  if (numericString.length > 2) {
    const enteros = numericString.slice(0, -2);
    const decimales = numericString.slice(-2);
    const enterosFormateados = parseInt(enteros, 10).toLocaleString('es-AR');
    return `${enterosFormateados},${decimales}`;
  }
  if (numericString.length === 2) return `0,${numericString}`;
  if (numericString.length === 1) return `0,0${numericString}`;
  return '';
};

const getMontoNumerico = (monto) => {
  if (!monto) return 0;
  const cleanValue = monto.replace(/\./g, '').replace(',', '.');
  const numericValue = parseFloat(cleanValue);
  return Number.isNaN(numericValue) ? 0 : numericValue;
};

export const useGastosUIStore = create((set, get) => ({
  formData: { ...initialFormData },

  modales: { confirmacion: false, salida: false, limpiar: false },
  setModal: (modal, estado) =>
    set((s) => ({ modales: { ...s.modales, [modal]: estado } })),
  openModal: (modal) =>
    set((s) => ({ modales: { ...s.modales, [modal]: true } })),
  closeModal: (modal) =>
    set((s) => ({ modales: { ...s.modales, [modal]: false } })),

  loading: { operacion: false },
  setLoading: (partial) =>
    set((s) => ({ loading: { ...s.loading, ...partial } })),

  setField: (field, value) =>
    set((s) => ({ formData: { ...s.formData, [field]: value } })),

  resetForm: () => set({ formData: { ...initialFormData } }),

  setFormData: (data) =>
    set((s) => ({ formData: { ...s.formData, ...data } })),

  setArchivo: (archivo) =>
    set((s) => ({ formData: { ...s.formData, archivo } })),

  setArchivoPreview: (preview) =>
    set((s) => ({ formData: { ...s.formData, archivoPreview: preview } })),

  limpiarArchivo: () =>
    set((s) => ({
      formData: { ...s.formData, archivo: null, archivoPreview: null },
    })),

  validarArchivo: (file) => {
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return { valido: false, mensaje: 'El archivo es demasiado grande. Máximo 10MB permitido.' };
    }
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(file.type)) {
      return {
        valido: false,
        mensaje: 'Tipo de archivo no válido. Solo se permiten: JPG, PNG, PDF, DOC, DOCX',
      };
    }
    return { valido: true, mensaje: '' };
  },

  handleArchivoChange: (e) => {
    const file = e.target.files?.[0];
    const { limpiarArchivo, validarArchivo, setArchivo, setArchivoPreview } = get();

    if (!file) {
      limpiarArchivo();
      return;
    }

    const validacion = validarArchivo(file);
    if (!validacion.valido) {
      limpiarArchivo();
      return validacion;
    }

    setArchivo(file);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setArchivoPreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setArchivoPreview(null);
    }

    return { valido: true };
  },

  obtenerArchivo: () => get().formData.archivo,
  hayArchivo: () => !!get().formData.archivo,

  getArchivoInfo: () => {
    const { archivo, archivoPreview } = get().formData;
    if (!archivo) return null;
    return {
      nombre: archivo.name,
      tamaño: `${(archivo.size / (1024 * 1024)).toFixed(2)} MB`,
      tipo: archivo.type,
      preview: archivoPreview,
    };
  },

  formatMonto,

  handleInputChange: (e) => {
    const { name, value } = e.target;
    if (name === 'monto') {
      get().setField(name, value === '' ? '' : formatMonto(value));
    } else {
      get().setField(name, value);
    }
  },

  isValidForm: () => {
    const { formData } = get();
    const required = ['descripcion', 'monto', 'formaPago'];
    return required.every((field) => {
      const value = formData[field];
      if (field === 'monto') return value && getMontoNumerico(value) > 0;
      return value && value.toString().trim() !== '';
    });
  },

  hasUnsavedData: () => {
    const { formData } = get();
    const hasFormData = Object.keys(initialFormData).some((key) => {
      if (key === 'archivo' || key === 'archivoPreview') return false;
      const value = formData[key];
      return value && value.toString().trim() !== '';
    });
    return hasFormData || get().hayArchivo();
  },

  getMontoNumerico: () => getMontoNumerico(get().formData.monto),

  prepararDatosParaBackend: () => {
    const { formData } = get();
    return {
      descripcion: (formData.descripcion || '').trim(),
      monto: getMontoNumerico(formData.monto),
      forma_pago: (formData.formaPago || '').trim(),
      observaciones: formData.observaciones
        ? (formData.observaciones || '').trim()
        : null,
    };
  },

  setMontoDesdeNumero: (numero) => {
    if (typeof numero === 'number' && numero >= 0) {
      const centavos = Math.round(numero * 100);
      get().setField('monto', formatMonto(centavos.toString()));
    }
  },
}));

export default useGastosUIStore;
