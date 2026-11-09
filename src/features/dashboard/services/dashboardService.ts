import { z } from 'zod';
import { formatInTimeZone } from 'date-fns-tz';
import { TIME_ZONE } from '@/lib/format';
import { supabase } from '@/lib/supabase';

const dashboardSchema = z.object({
  month: z.string(),
  packages_by_status: z.array(z.object({ id: z.number(), name: z.string(), count: z.coerce.number() })),
  income: z.coerce.number(),
  pending_balance: z.coerce.number(),
  deliveries: z.coerce.number(),
  clients: z.coerce.number(),
  deliverers: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      month_delivered: z.coerce.number(),
      total_delivered: z.coerce.number(),
      in_progress: z.coerce.number(),
    }),
  ),
});
export type Dashboard = z.infer<typeof dashboardSchema>;

/** Mes actual en Managua, con el formato del campo de mes: 2026-11. */
export function currentMonth(now: Date = new Date()): string {
  return formatInTimeZone(now, TIME_ZONE, 'yyyy-MM');
}

/** RF-58 y RF-59: el cálculo vive en la base (RPC admin_dashboard); la web solo lo muestra. */
export async function fetchDashboard(month: string): Promise<Dashboard> {
  const { data, error } = await supabase.rpc('admin_dashboard', { p_month: `${month}-01` });
  if (error) throw error;
  return dashboardSchema.parse(data);
}
