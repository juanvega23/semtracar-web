import { z } from 'zod';
import type { AppConfig } from '@/lib/appConfig';

export const quotationSchema = z.object({
  weight: z
    .string()
    .trim()
    .min(1, 'Escribe el peso en libras.')
    .regex(/^\d+(?:[.,]\d+)?$/, 'Escribe un peso decimal válido.')
    .transform((value) => Number(value.replace(',', '.')))
    .pipe(z.number().positive('El peso debe ser mayor que 0.').max(1000, 'El peso máximo es 1000 lb.')),
  method: z.string().min(1, 'Selecciona el método de envío.'),
  category: z.string().min(1, 'Selecciona una categoría.'),
});
export type QuotationInput = z.input<typeof quotationSchema>;

export function calculateQuotation(weight: number, methodId: number, categoryId: number, config: AppConfig) {
  const rate = config.ratesByShippingMethod[methodId];
  const multiplier = config.multipliersByPackageType[categoryId];
  if (!Number.isFinite(weight) || weight <= 0 || weight > 1000)
    throw new Error('El peso debe ser mayor que 0 y como máximo 1000 lb.');
  if (!Number.isFinite(rate) || rate <= 0 || !Number.isFinite(multiplier) || multiplier <= 0)
    throw new Error('Esta combinación de envío y categoría no tiene una tarifa disponible.');
  const base = weight * rate;
  return {
    weight,
    rate,
    multiplier,
    base,
    surcharge: base * (multiplier - 1),
    total: Math.round((base * multiplier + Number.EPSILON) * 100) / 100,
  };
}
