import { es } from 'date-fns/locale';
import { formatInTimeZone } from 'date-fns-tz';

/** Zona horaria en la que se muestran todas las fechas (RF-27, RNF-29). La BD guarda en UTC. */
export const TIME_ZONE = 'America/Managua';

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Monto en USD con 2 decimales: `$1,234.50`. Acepta number o string (numeric de Postgres). */
export function formatUSD(amount: number | string | null | undefined): string {
  const value = typeof amount === 'string' ? Number(amount) : (amount ?? 0);
  return usd.format(Number.isFinite(value) ? value : 0);
}

type DateInput = string | number | Date;

function toDate(value: DateInput): Date {
  return value instanceof Date ? value : new Date(value);
}

function formatInManagua(value: DateInput, pattern: string): string {
  return formatInTimeZone(toDate(value), TIME_ZONE, pattern, { locale: es });
}

/** `29 jul 2026` */
export function formatDate(value: DateInput): string {
  return formatInManagua(value, 'd MMM yyyy');
}

/** `1:21 p. m.` */
export function formatTime(value: DateInput): string {
  return formatInManagua(value, 'h:mm aaa').replace(/am$/, 'a. m.').replace(/pm$/, 'p. m.');
}

/** `29 jul 2026 · 1:21 p. m.` */
export function formatDateTime(value: DateInput): string {
  return `${formatDate(value)} · ${formatTime(value)}`;
}

/** Número visible del recibo: `REC-00042` (RF-31). */
export function formatInvoiceNumber(invoiceNumber: number | null | undefined): string {
  return `REC-${String(invoiceNumber ?? 0).padStart(5, '0')}`;
}

/** `Juan Vega` */
export function formatFullName(user: { name: string; last_name: string }): string {
  return `${user.name} ${user.last_name}`.trim();
}
