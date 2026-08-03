import ProductoSelector from './SelectorProductos';
import { useListaPrecios } from '../../context/ListaPreciosContext';

export default function ProductoSelectorListaPrecios() {
  const listaPrecios = useListaPrecios();
  return (
    <ProductoSelector
      contextAdapter={listaPrecios}
      mostrarPreciosConIva
      mostrarBotonFletes={false}
      containerClassName="bg-blue-500 p-6 rounded-lg flex-1 text-white"
      title="Productos"
    />
  );
}