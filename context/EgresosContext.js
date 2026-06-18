// context/EgresosContext.js — bridge v2 hacia Zustand (UI state)
import { useEgresosUIStore } from '@/stores/egresosUIStore';

export function EgresosProvider({ children }) {
  return children;
}

export function useEgresos() {
  return useEgresosUIStore();
}
