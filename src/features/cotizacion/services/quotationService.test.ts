import { calculateQuotation, quotationSchema } from './quotationService';

const config = {
  ratesByShippingMethod: { 1: 6.5, 2: 3.5 },
  multipliersByPackageType: { 1: 1, 2: 1.1 },
  deliveryCost: 3.58,
};

describe('cotización (RF-11 a RF-15)', () => {
  it('calcula peso decimal, tarifa y multiplicador y redondea al final', () => {
    expect(calculateQuotation(2.5, 1, 2, config)).toMatchObject({
      base: 16.25,
      total: 17.88,
      multiplier: 1.1,
    });
    expect(calculateQuotation(2.5, 2, 1, config).total).toBe(8.75);
  });
  it('usa las tarifas configuradas, sin fijar el precio en la vista', () => {
    expect(calculateQuotation(2, 1, 1, { ...config, ratesByShippingMethod: { 1: 8 } }).total).toBe(16);
    expect(() => calculateQuotation(2, 1, 4, config)).toThrow(/tarifa/);
  });
  it.each(['', '0', '-1', '1000.01', 'Infinity', '1e2', '1.2.3'])('rechaza peso inválido: %s', (weight) => {
    expect(quotationSchema.safeParse({ weight, method: '1', category: '1' }).success).toBe(false);
  });
  it('acepta el límite y coma decimal', () => {
    expect(quotationSchema.parse({ weight: '1000', method: '1', category: '1' }).weight).toBe(1000);
    expect(quotationSchema.parse({ weight: '2,5', method: '1', category: '1' }).weight).toBe(2.5);
  });
});
