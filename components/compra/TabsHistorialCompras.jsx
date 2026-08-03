import { cn } from '@/lib/utils';

const tabs = [
  { id: 'compras', label: 'Compras a Proveedores', color: 'text-emerald-600 border-emerald-500' },
  { id: 'gastos', label: 'Gastos Generales', color: 'text-blue-600 border-blue-500' },
  { id: 'todos', label: 'Todos los Egresos', color: 'text-purple-600 border-purple-500' },
];

export default function TabsHistorialCompras({ vistaActiva, onChange, totalCompras, totalGastos }) {
  const counts = {
    compras: totalCompras,
    gastos: totalGastos,
    todos: totalCompras + totalGastos,
  };

  return (
    <div className="mb-6 flex border-b">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors',
            vistaActiva === tab.id
              ? `border-b-2 ${tab.color}`
              : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => onChange(tab.id)}
        >
          {tab.label} ({counts[tab.id]})
        </button>
      ))}
    </div>
  );
}
