import { toAppConfig } from './appConfig';

describe('toAppConfig', () => {
  it('agrupa tarifas, multiplicadores y delivery (valores de la migración)', () => {
    const config = toAppConfig([
      { key: 'tarifa_aereo', value: 6.5, shipping_method_id: 1, package_type_id: null },
      { key: 'tarifa_maritimo', value: 3.5, shipping_method_id: 2, package_type_id: null },
      { key: 'multiplicador_ropa', value: 1, shipping_method_id: null, package_type_id: 1 },
      { key: 'multiplicador_joyeria', value: 1.1, shipping_method_id: null, package_type_id: 2 },
      { key: 'costo_delivery', value: 3.58, shipping_method_id: null, package_type_id: null },
    ]);
    expect(config.ratesByShippingMethod).toEqual({ 1: 6.5, 2: 3.5 });
    expect(config.multipliersByPackageType).toEqual({ 1: 1, 2: 1.1 });
    expect(config.deliveryCost).toBe(3.58);
  });
});
