import { z } from 'zod';

export const gastoSchema = z.object({
  descripcion: z.string().min(1, 'La descripción es obligatoria'),
  monto: z
    .string()
    .min(1, 'El monto es obligatorio')
    .refine((value) => {
      const normalized = value.replace(/\./g, '').replace(',', '.');
      const parsed = Number(normalized);
      return Number.isFinite(parsed) && parsed > 0 && parsed <= 99999999.99;
    }, 'El monto debe ser mayor a 0 y menor a $99.999.999,99'),
  formaPago: z.string().min(1, 'Debe seleccionar una forma de pago'),
  observaciones: z.string().optional(),
});

export const compraConfirmacionSchema = z.object({
  cuentaSeleccionada: z.string().min(1, 'Debe seleccionar una cuenta de origen'),
  subtotalSinIva: z.number().nonnegative(),
  ivaTotal: z.number().nonnegative(),
  totalConIva: z.number().positive('El total debe ser mayor a cero'),
  actualizarStock: z.boolean(),
  observaciones: z.string().optional(),
});

export const descuentoVentaSchema = z.object({
  tipoDescuento: z.enum(['numerico', 'porcentaje']),
  valorDescuento: z
    .string()
    .min(1, 'Ingrese un valor')
    .refine((value) => Number(value) > 0, 'Ingrese un valor mayor a cero'),
});

export const facturacionVentaSchema = z.object({
  tipoFiscal: z.enum(['A', 'B', 'X']),
});

