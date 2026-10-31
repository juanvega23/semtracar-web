import { useQuery } from '@tanstack/react-query';
import { supabase } from './supabase';

/**
 * RNF-34: tarifas, multiplicadores y costo de delivery desde la tabla app_config.
 * Nunca escribas estos números en los componentes: léelos con useAppConfig().
 */
export type AppConfig = {
  /** Tarifa por libra (USD) por id de shipping_methods. */
  ratesByShippingMethod: Record<number, number>;
  /** Multiplicador por id de package_types. Sin entrada = la categoría no se cotiza. */
  multipliersByPackageType: Record<number, number>;
  /** Costo de delivery que se suma al recibo (USD). */
  deliveryCost: number;
};

type AppConfigRow = {
  key: string;
  value: number;
  shipping_method_id: number | null;
  package_type_id: number | null;
};

export function toAppConfig(rows: AppConfigRow[]): AppConfig {
  const config: AppConfig = { ratesByShippingMethod: {}, multipliersByPackageType: {}, deliveryCost: 0 };
  for (const row of rows) {
    const value = Number(row.value);
    if (row.key === 'costo_delivery') config.deliveryCost = value;
    else if (row.key.startsWith('tarifa_') && row.shipping_method_id !== null)
      config.ratesByShippingMethod[row.shipping_method_id] = value;
    else if (row.key.startsWith('multiplicador_') && row.package_type_id !== null)
      config.multipliersByPackageType[row.package_type_id] = value;
  }
  return config;
}

export async function fetchAppConfig(): Promise<AppConfig> {
  const { data, error } = await supabase
    .from('app_config')
    .select('key, value, shipping_method_id, package_type_id');
  if (error) throw error;
  return toAppConfig(data);
}

export function useAppConfig() {
  return useQuery({ queryKey: ['app-config'], queryFn: fetchAppConfig, staleTime: 10 * 60_000 });
}
