import { AlertCircle, Inbox, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LoadingState({ message = 'Cargando...', className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground', className)}>
      <Loader2 className="h-6 w-6 animate-spin" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function EmptyState({ message = 'Sin resultados', className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground', className)}>
      <Inbox className="h-8 w-8 opacity-50" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function ErrorState({ message = 'Ocurrió un error', className, onRetry }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 py-8 text-destructive', className)}>
      <AlertCircle className="h-8 w-8" />
      <p className="text-sm">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="text-sm underline underline-offset-4 hover:opacity-80"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
