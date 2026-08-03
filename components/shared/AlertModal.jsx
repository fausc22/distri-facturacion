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

export function AlertModal({
  open,
  onOpenChange,
  title = 'Aviso',
  description,
  actionLabel = 'Entendido',
  variant = 'primary',
  zIndex = Z_INDEX.MODAL_BASE,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent zIndex={zIndex}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter>
          <Button variant={variant} onClick={() => onOpenChange?.(false)}>
            {actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AlertModal;
