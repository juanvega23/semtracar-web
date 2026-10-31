import {
  formatDate,
  formatDateTime,
  formatFullName,
  formatInvoiceNumber,
  formatTime,
  formatUSD,
} from './format';

describe('formatUSD', () => {
  it('muestra USD con 2 decimales y separador de miles', () => {
    expect(formatUSD(1234.5)).toBe('$1,234.50');
    expect(formatUSD(3.58)).toBe('$3.58');
    expect(formatUSD(0)).toBe('$0.00');
  });

  it('acepta numeric de Postgres como texto y valores vacíos', () => {
    expect(formatUSD('19.5')).toBe('$19.50');
    expect(formatUSD(null)).toBe('$0.00');
    expect(formatUSD('abc')).toBe('$0.00');
  });
});

describe('fechas en America/Managua', () => {
  // 19:21 UTC = 13:21 en Managua (UTC-6, sin horario de verano)
  const utc = '2026-07-29T19:21:00Z';

  it('convierte de UTC a la hora de Managua', () => {
    expect(formatTime(utc)).toBe('1:21 p. m.');
    expect(formatDate(utc)).toBe('29 jul 2026');
    expect(formatDateTime(utc)).toBe('29 jul 2026 · 1:21 p. m.');
  });

  it('cambia de día cuando en UTC ya es el día siguiente', () => {
    expect(formatDate('2026-07-30T03:00:00Z')).toBe('29 jul 2026');
    expect(formatTime('2026-07-30T03:00:00Z')).toBe('9:00 p. m.');
  });

  it('muestra a. m. en la mañana', () => {
    expect(formatTime('2026-07-29T14:05:00Z')).toBe('8:05 a. m.');
  });
});

describe('formatInvoiceNumber', () => {
  it('rellena a 5 dígitos con el prefijo REC', () => {
    expect(formatInvoiceNumber(42)).toBe('REC-00042');
    expect(formatInvoiceNumber(123456)).toBe('REC-123456');
  });
});

describe('formatFullName', () => {
  it('une nombre y apellido', () => {
    expect(formatFullName({ name: 'Juan', last_name: 'Vega' })).toBe('Juan Vega');
  });
});
