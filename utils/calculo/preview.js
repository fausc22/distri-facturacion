import { calcular } from './v1.js';
export const motorV1 = process.env.NEXT_PUBLIC_MOTOR_CALCULO_VERSION === 'v1';
export function previewImportes(productos, descuento = null) {
  const tasas = { 0: 3, 10.5: 4, 21: 5, 27: 6 };
  try {
    const input = {
      lineas: productos.map((p,i) => ({
        linea_id: String(i + 1),
        precio_int: BigInt(Math.round(Number(p.precio ?? p.precio_unitario) * 1e6)),
        cantidad_int: BigInt(Math.round(Number(p.cantidad) * 1e3)),
        alicuota_id: tasas[p.porcentaje_iva ?? 21],
        descuento_linea_pct: BigInt(Math.round(Number(p.descuento_porcentaje || 0) * 100))
      })),
      descuento_global_pct: descuento?.tipo === 'porcentaje' ? BigInt(Math.round(Number(descuento.valor) * 100)) : 0n,
      descuento_global_fijo_centavos: descuento && descuento.tipo !== 'porcentaje' ? BigInt(Math.round(Number(descuento.descuentoCalculado ?? descuento.valor) * 100)) : 0n
    };
    const r = calcular(input);
    if (!r.ok) return { error: r.code };
    return { subtotal: Number(r.totales.neto) / 100, iva: Number(r.totales.iva) / 100, total: Number(r.totales.total) / 100 };
  } catch (e) { return { error: e.message }; }
}
