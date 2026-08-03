import { useFondosUIStore } from '@/stores/fondosUIStore';

export function FondosProvider({ children }) {
  return children;
}

export function useFondos() {
  return useFondosUIStore();
}
