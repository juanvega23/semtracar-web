import { barWidth, currentMonth } from './dashboardService';

describe('currentMonth', () => {
  it('usa el mes de Managua, no el de UTC', () => {
    // 1 de noviembre 03:00 UTC sigue siendo 31 de octubre en Managua (UTC-6).
    expect(currentMonth(new Date('2026-11-01T03:00:00Z'))).toBe('2026-10');
    expect(currentMonth(new Date('2026-11-01T07:00:00Z'))).toBe('2026-11');
  });
});

describe('barWidth', () => {
  it('es proporcional al valor mayor', () => {
    expect(barWidth(10, 10)).toBe(100);
    expect(barWidth(5, 10)).toBe(50);
  });

  it('no dibuja barra sin datos y hace visibles los valores pequeños', () => {
    expect(barWidth(0, 10)).toBe(0);
    expect(barWidth(0, 0)).toBe(0);
    expect(barWidth(1, 1000)).toBe(4);
  });
});
