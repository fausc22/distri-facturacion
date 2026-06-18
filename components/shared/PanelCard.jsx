import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function PanelCard({ title, description, children, className, footer }) {
  return (
    <Card className={cn('bg-muted/20', className)}>
      <CardHeader className="border-b pb-4">
        <CardTitle className="text-xl">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="pt-6">{children}</CardContent>
      {footer && <div className="border-t px-6 py-4">{footer}</div>}
    </Card>
  );
}

export default PanelCard;
