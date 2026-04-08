/**
 * Fase 3: evita setState en cada paso de un bucle largo (p. ej. sync offline).
 * Con muchos ítems, actualizar progreso en cada iteración re-renderiza React N veces.
 */
export function shouldEmitSyncProgress(step, total) {
  if (total <= 10) return true;
  if (step === 1 || step === total) return true;
  return step % 5 === 0;
}
