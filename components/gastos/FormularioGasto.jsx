import { useEffect } from 'react';
import { useFormularioGasto } from '@/hooks/gastos/useFormularioGasto';
import { useCuentasSimple } from '@/hooks/compra/useCuentasSimple';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import FormFieldError from '@/components/shared/FormFieldError';
import { gastoSchema } from '@/lib/formSchemas';
import { useZodForm } from '@/hooks/forms/useZodForm';
import { LoadingState } from '@/components/shared/StateViews';

function CampoDescripcion({ value, opcionesDescripcion, onChange, error }) {
  return (
    <div className="mb-6">
      <Label htmlFor="descripcion">
        Descripción <span className="text-destructive">*</span>
      </Label>
      <select
        id="descripcion"
        name="descripcion"
        value={value}
        onChange={onChange}
        className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        required
      >
        <option value="">Seleccione un tipo de gasto</option>
        {opcionesDescripcion.map((opcion) => (
          <option key={opcion} value={opcion}>
            {opcion}
          </option>
        ))}
      </select>
      <FormFieldError message={error} />
    </div>
  );
}

function CampoMonto({ value, onChange, error }) {
  return (
    <div className="mb-6">
      <Label htmlFor="monto">
        Monto ($) <span className="text-destructive">*</span>
      </Label>
      <div className="mt-2 flex">
        <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm">
          $
        </span>
        <Input
          type="text"
          id="monto"
          name="monto"
          value={value}
          onChange={onChange}
          className="rounded-l-none"
          placeholder="0,00"
          required
        />
      </div>
      <FormFieldError message={error} />
    </div>
  );
}

function CampoFormaPago({ value, opcionesFormaPago, onChange, error }) {
  return (
    <div className="mb-6">
      <Label>
        Forma de Pago <span className="text-destructive">*</span>
      </Label>
      <div className="mt-2 flex flex-wrap gap-4">
        {opcionesFormaPago.map((opcion) => (
          <label key={opcion} className="flex items-center text-sm">
            <input
              type="radio"
              name="formaPago"
              value={opcion}
              checked={value === opcion}
              onChange={onChange}
              className="mr-2 h-4 w-4"
            />
            {opcion}
          </label>
        ))}
      </div>
      <FormFieldError message={error} />
    </div>
  );
}

function CampoCuenta({ value, cuentas, loadingCuentas, onChange, error }) {
  return (
    <div className="mb-6">
      <Label htmlFor="cuentaId">
        Cuenta de origen (egreso) <span className="text-destructive">*</span>
      </Label>
      {loadingCuentas ? (
        <LoadingState message="Cargando cuentas..." />
      ) : (
        <select
          id="cuentaId"
          name="cuentaId"
          value={value}
          onChange={onChange}
          className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          required
        >
          <option value="">Seleccionar cuenta...</option>
          {cuentas.map((cuenta) => (
            <option key={cuenta.id} value={String(cuenta.id)}>
              {cuenta.nombre} - Saldo: ${Number(cuenta.saldo).toFixed(2)}
            </option>
          ))}
        </select>
      )}
      <FormFieldError message={error} />
    </div>
  );
}

function CampoObservaciones({ value, onChange }) {
  return (
    <div className="mb-6">
      <Label htmlFor="observaciones">Observaciones</Label>
      <textarea
        id="observaciones"
        name="observaciones"
        value={value}
        onChange={onChange}
        rows={3}
        className="mt-2 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        placeholder="Ingrese cualquier observación o detalle adicional"
      />
    </div>
  );
}

export default function FormularioGasto() {
  const { formData, opcionesDescripcion, opcionesFormaPago, handleInputChange } =
    useFormularioGasto();
  const { cuentas, loadingCuentas } = useCuentasSimple(true);
  const { register, watch, setValue, trigger, formState } = useZodForm({
    schema: gastoSchema,
    defaultValues: {
      descripcion: formData.descripcion || '',
      monto: formData.monto || '',
      formaPago: formData.formaPago || '',
      cuentaId: formData.cuentaId || '',
      observaciones: formData.observaciones || '',
    },
  });

  const descripcionValue = watch('descripcion');
  const montoValue = watch('monto');
  const formaPagoValue = watch('formaPago');
  const cuentaIdValue = watch('cuentaId');
  const observacionesValue = watch('observaciones');

  useEffect(() => {
    handleInputChange({ target: { name: 'descripcion', value: descripcionValue } });
    handleInputChange({ target: { name: 'monto', value: montoValue } });
    handleInputChange({ target: { name: 'formaPago', value: formaPagoValue } });
    handleInputChange({ target: { name: 'cuentaId', value: cuentaIdValue } });
    handleInputChange({ target: { name: 'observaciones', value: observacionesValue } });
    trigger();
  }, [
    descripcionValue,
    montoValue,
    formaPagoValue,
    cuentaIdValue,
    observacionesValue,
    handleInputChange,
    trigger,
  ]);

  return (
    <div>
      <CampoDescripcion
        value={descripcionValue}
        opcionesDescripcion={opcionesDescripcion}
        onChange={register('descripcion').onChange}
        error={formState.errors.descripcion?.message}
      />
      <CampoMonto
        value={montoValue}
        onChange={register('monto').onChange}
        error={formState.errors.monto?.message}
      />
      <CampoFormaPago
        value={formaPagoValue}
        opcionesFormaPago={opcionesFormaPago}
        onChange={register('formaPago').onChange}
        error={formState.errors.formaPago?.message}
      />
      <CampoCuenta
        value={cuentaIdValue || ''}
        cuentas={cuentas}
        loadingCuentas={loadingCuentas}
        onChange={(e) => {
          setValue('cuentaId', e.target.value);
          handleInputChange({ target: { name: 'cuentaId', value: e.target.value } });
        }}
        error={formState.errors.cuentaId?.message}
      />
      <CampoObservaciones value={observacionesValue} onChange={register('observaciones').onChange} />
    </div>
  );
}
