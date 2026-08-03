import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Z_INDEX } from '@/constants/zIndex';

export function FormModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  submitLabel = 'Guardar',
  cancelLabel = 'Cancelar',
  onSubmit,
  loading = false,
  size = 'default',
  zIndex = Z_INDEX.MODAL_BASE,
  hideFooter = false,
  disableSubmit = false,
}) {
  const sizeClass =
    size === 'lg' ? 'max-w-2xl' : size === 'xl' ? 'max-w-4xl' : 'max-w-lg';

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(e);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent zIndex={zIndex} className={sizeClass}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          <div className="py-4">{children}</div>
          {!hideFooter && (
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange?.(false)}
                disabled={loading}
              >
                {cancelLabel}
              </Button>
              <Button type="submit" disabled={loading || disableSubmit}>
                {loading ? 'Guardando...' : submitLabel}
              </Button>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default FormModal;
