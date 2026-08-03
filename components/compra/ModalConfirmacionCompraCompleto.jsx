import { useState, useEffect } from 'react';
import toast from '@/components/shared/toast';
import { FormModal } from '@/components/shared/FormModal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingState } from '@/components/shared/StateViews';
import { useCuentasSimple } from '@/hooks/compra/useCuentasSimple';
import { useZodForm } from '@/hooks/forms/useZodForm';
import { compraConfirmacionSchema } from '@/lib/formSchemas';
import FormFieldError from '@/components/shared/FormFieldError';

export function ModalConfirmacionCompraCompleto({ 
  mostrar, 
  onClose, 
  proveedor, 
  productos, 
  totalInicial,
  onConfirmarCompra,
  loading = false
}) {
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState('');
  const [subtotalSinIva, setSubtotalSinIva] = useState(0);
  const [ivaTotal, setIvaTotal] = useState(0);
  const [totalConIva, setTotalConIva] = useState(0);
  const [actualizarStock, setActualizarStock] = useState(true);
  const [observaciones, setObservaciones] = useState('');

  const { cuentas, cargarCuentas, loadingCuentas } = useCuentasSimple(mostrar);
  const { register, setValue, trigger, formState } = useZodForm({
    schema: compraConfirmacionSchema,
    defaultValues: {
      cuentaSeleccionada: '',
      subtotalSinIva: 0,
      ivaTotal: 0,
      totalConIva: 0,
      actualizarStock: true,
      observaciones: '',
    },
  });

  useEffect(() => {
    if (mostrar && productos && productos.length > 0) {
      // Calcular totales iniciales desde los productos
      const subtotal = productos.reduce((acc, prod) => acc + (Number(prod.subtotal) || 0), 0);
      const iva = subtotal * 0.21; // IVA del 21%
      const total = subtotal + iva;

      setSubtotalSinIva(subtotal);
      setIvaTotal(iva);
      setTotalConIva(total);
      setValue('subtotalSinIva', subtotal);
      setValue('ivaTotal', iva);
      setValue('totalConIva', total);
    }
  }, [mostrar, productos, setValue]);

  useEffect(() => {
    if (mostrar) {
      cargarCuentas();
    }
  }, [mostrar]);

  const actualizarMontos = (campo, valor) => {
    const numeroValor = parseFloat(valor) || 0;
    switch (campo) {
      case 'subtotal':
        setSubtotalSinIva(numeroValor);
        const nuevoIva = numeroValor * 0.21;
        setIvaTotal(nuevoIva);
        setTotalConIva(numeroValor + nuevoIva);
        setValue('subtotalSinIva', numeroValor);
        setValue('ivaTotal', nuevoIva);
        setValue('totalConIva', numeroValor + nuevoIva);
        break;
      case 'iva':
        setIvaTotal(numeroValor);
        setTotalConIva(subtotalSinIva + numeroValor);
        setValue('ivaTotal', numeroValor);
        setValue('totalConIva', subtotalSinIva + numeroValor);
        break;
      case 'total':
        setTotalConIva(numeroValor);
        const proporcionIva = ivaTotal / (subtotalSinIva + ivaTotal) || 0.21;
        const nuevoIvaCalculado = numeroValor * proporcionIva;
        const nuevoSubtotal = numeroValor - nuevoIvaCalculado;
        setSubtotalSinIva(nuevoSubtotal);
        setIvaTotal(nuevoIvaCalculado);
        setValue('totalConIva', numeroValor);
        setValue('subtotalSinIva', nuevoSubtotal);
        setValue('ivaTotal', nuevoIvaCalculado);
        break;
      default:
        break;
    }
  };

  const handleConfirmar = async () => {
    const isValid = await trigger();
    if (!isValid) {
      toast.error('Revise los campos obligatorios antes de confirmar');
      return;
    }
    if (!cuentaSeleccionada) {
      toast.error('Debe seleccionar una cuenta de origen para el egreso');
      return;
    }

    if (totalConIva <= 0) {
      toast.error('El total debe ser mayor a cero');
      return;
    }

    const datosCompra = {
      proveedor_id: proveedor.id,
      proveedor_nombre: proveedor.nombre,
      proveedor_cuit: proveedor.cuit,
      total: totalConIva.toFixed(2),
      subtotal: subtotalSinIva.toFixed(2),
      iva_total: ivaTotal.toFixed(2),
      fecha: new Date().toISOString().slice(0, 10),
      productos: productos,
      cuentaId: cuentaSeleccionada,
      actualizarStock: actualizarStock,
      observaciones: observaciones || 'Compra registrada desde sistema'
    };

    const resultado = await onConfirmarCompra(datosCompra);

    if (resultado === true || resultado?.success) {
      limpiarFormulario();
      onClose();
    }
  };

  const limpiarFormulario = () => {
    setCuentaSeleccionada('');
    setSubtotalSinIva(0);
    setIvaTotal(0);
    setTotalConIva(0);
    setActualizarStock(true);
    setObservaciones('');
  };

  const handleClose = () => {
    limpiarFormulario();
    onClose();
  };

  if (!mostrar) return null;

  return (
    <FormModal
      open={mostrar}
      onOpenChange={(open) => !open && handleClose()}
      title={`Confirmar Compra - ${proveedor?.nombre}`}
      size="xl"
      submitLabel={loading ? 'Procesando...' : 'Confirmar Compra'}
      cancelLabel="Cancelar"
      loading={loading}
      disableSubmit={!cuentaSeleccionada || totalConIva <= 0}
      onSubmit={handleConfirmar}
    >
      <div className="space-y-6">
        <div className="rounded-lg border bg-blue-50/50 p-4">
          <h3 className="mb-2 font-semibold">Información del Proveedor</h3>
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <span className="font-medium">Proveedor:</span> {proveedor?.nombre}
            </div>
            <div>
              <span className="font-medium">CUIT:</span> {proveedor?.cuit || 'No informado'}
            </div>
            <div>
              <span className="font-medium">Productos:</span> {productos?.length || 0}
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="cuenta-origen">Cuenta de origen (egreso) *</Label>
            {loadingCuentas ? (
              <LoadingState message="Cargando cuentas..." />
            ) : (
              <select
                id="cuenta-origen"
                value={cuentaSeleccionada}
                onChange={(e) => {
                  setCuentaSeleccionada(e.target.value);
                  setValue('cuentaSeleccionada', e.target.value);
                }}
                className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="">Seleccionar cuenta...</option>
                {cuentas.map((cuenta) => (
                  <option key={cuenta.id} value={cuenta.id}>
                    {cuenta.nombre} - Saldo: ${Number(cuenta.saldo).toFixed(2)}
                  </option>
                ))}
              </select>
            )}
            <FormFieldError message={formState.errors.cuentaSeleccionada?.message} />
          </div>

          <div>
            <Label>Actualizar Stock</Label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:gap-4">
              <label className="flex items-center text-sm">
                <input
                  type="radio"
                  checked={actualizarStock}
                  onChange={() => {
                    setActualizarStock(true);
                    setValue('actualizarStock', true);
                  }}
                  className="mr-2"
                />
                Sí, actualizar stock
              </label>
              <label className="flex items-center text-sm">
                <input
                  type="radio"
                  checked={!actualizarStock}
                  onChange={() => {
                    setActualizarStock(false);
                    setValue('actualizarStock', false);
                  }}
                  className="mr-2"
                />
                No actualizar
              </label>
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="observaciones-compra">Observaciones</Label>
          <textarea
            id="observaciones-compra"
            value={observaciones}
            onChange={(e) => {
              setObservaciones(e.target.value);
              setValue('observaciones', e.target.value);
            }}
            className="mt-2 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Observaciones adicionales sobre la compra..."
          />
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold">Montos de Compra</h3>
          <div>
            <Label htmlFor="subtotal">Subtotal (sin IVA)</Label>
            <Input
              id="subtotal"
              type="number"
              value={subtotalSinIva.toFixed(2)}
              onChange={(e) => actualizarMontos('subtotal', e.target.value)}
              step="0.01"
              min="0"
              className="mt-2"
            />
            <FormFieldError message={formState.errors.subtotalSinIva?.message} />
          </div>
          <div>
            <Label htmlFor="iva">IVA Total (21%)</Label>
            <Input
              id="iva"
              type="number"
              value={ivaTotal.toFixed(2)}
              onChange={(e) => actualizarMontos('iva', e.target.value)}
              step="0.01"
              min="0"
              className="mt-2"
            />
            <FormFieldError message={formState.errors.ivaTotal?.message} />
          </div>
          <div>
            <Label htmlFor="total">Total (con IVA)</Label>
            <Input
              id="total"
              type="number"
              value={totalConIva.toFixed(2)}
              onChange={(e) => actualizarMontos('total', e.target.value)}
              step="0.01"
              min="0"
              className="mt-2 font-semibold"
            />
            <FormFieldError message={formState.errors.totalConIva?.message} />
          </div>
        </div>

        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <h3 className="mb-2 font-semibold text-destructive">Resumen Final (Egreso)</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${subtotalSinIva.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>IVA (21%):</span>
              <span>${ivaTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-lg font-bold">
              <span>Total a Egresar:</span>
              <span className="text-destructive">${totalConIva.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </FormModal>
  );
}