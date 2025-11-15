import { useControlStock } from '../../context/ControlStockContext';

export default function FiltroStock() {
  const { filtroTipo, cantidadFiltro, setFiltroTipo, setCantidadFiltro } = useControlStock();

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo de Filtro
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setFiltroTipo('menor')}
            className={`flex-1 px-4 py-3 rounded-md font-medium transition-colors ${
              filtroTipo === 'menor'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Menor Stock
          </button>
          <button
            onClick={() => setFiltroTipo('mayor')}
            className={`flex-1 px-4 py-3 rounded-md font-medium transition-colors ${
              filtroTipo === 'mayor'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Mayor Stock
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cantidad de Productos ({cantidadFiltro})
        </label>
        <input
          type="range"
          min="10"
          max="200"
          step="10"
          value={cantidadFiltro}
          onChange={(e) => setCantidadFiltro(parseInt(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>10</span>
          <span>200</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Se generará un PDF con los <strong>{cantidadFiltro} productos</strong> con{' '}
          <strong>{filtroTipo === 'menor' ? 'menor' : 'mayor'}</strong> stock.
        </p>
      </div>
    </div>
  );
}

