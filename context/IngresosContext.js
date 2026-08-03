// context/IngresosContext.js — bridge v2 hacia Zustand (UI state)
import { useIngresosUIStore } from '@/stores/ingresosUIStore';

export function IngresosProvider({ children }) {
  return children;
}

export function useIngresos() {
  return useIngresosUIStore();
}
