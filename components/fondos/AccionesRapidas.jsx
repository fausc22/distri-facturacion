import { MdArrowDownward, MdArrowUpward, MdSwapHoriz } from 'react-icons/md';
import { Button } from '@/components/ui/button';

export default function AccionesRapidas({ onIngreso, onEgreso, onTransferencia }) {
  return (
    <div className="mt-8">
      <h2 className="mb-4 text-xl font-semibold">Acciones rápidas</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Button
          type="button"
          onClick={onIngreso}
          className="h-auto flex-col gap-2 bg-emerald-600 py-6 hover:bg-emerald-700"
        >
          <MdArrowDownward className="text-3xl" />
          <span className="font-semibold">Registrar ingreso</span>
        </Button>

        <Button
          type="button"
          onClick={onEgreso}
          variant="destructive"
          className="h-auto flex-col gap-2 py-6"
        >
          <MdArrowUpward className="text-3xl" />
          <span className="font-semibold">Registrar egreso</span>
        </Button>

        <Button type="button" onClick={onTransferencia} className="h-auto flex-col gap-2 py-6">
          <MdSwapHoriz className="text-3xl" />
          <span className="font-semibold">Realizar transferencia</span>
        </Button>
      </div>
    </div>
  );
}
