// context/GastosContext.js — bridge v2 hacia Zustand
import { useGastosUIStore } from '@/stores/gastosUIStore';

export function GastoProvider({ children }) {
  return children;
}

export const useGasto = () => {
  const store = useGastosUIStore();
  return {
    formData: store.formData,
    setField: store.setField,
    resetForm: store.resetForm,
    setFormData: store.setFormData,
    handleInputChange: store.handleInputChange,
    setMontoDesdeNumero: store.setMontoDesdeNumero,
    handleArchivoChange: store.handleArchivoChange,
    obtenerArchivo: store.obtenerArchivo,
    hayArchivo: store.hayArchivo,
    limpiarArchivo: store.limpiarArchivo,
    getArchivoInfo: store.getArchivoInfo,
    validarArchivo: store.validarArchivo,
    formatMonto: store.formatMonto,
    isValidForm: store.isValidForm,
    hasUnsavedData: store.hasUnsavedData,
    getMontoNumerico: store.getMontoNumerico,
    prepararDatosParaBackend: store.prepararDatosParaBackend,
    modales: store.modales,
    setModal: store.setModal,
    openModal: store.openModal,
    closeModal: store.closeModal,
    loading: store.loading,
    setLoading: store.setLoading,
  };
};
