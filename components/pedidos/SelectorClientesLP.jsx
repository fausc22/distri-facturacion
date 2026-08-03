import ClienteSelector from './SelectorClientes';
import { useListaPrecios } from '../../context/ListaPreciosContext';

export default function ClienteSelectorListaPrecios() {
  const listaPrecios = useListaPrecios();
  return (
    <ClienteSelector
      contextAdapter={listaPrecios}
      allowCreate={false}
      containerClassName="bg-blue-900 text-white p-6 rounded-lg flex-1 min-w-[300px]"
      title="Cliente"
    />
  );
}