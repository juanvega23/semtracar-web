import { currentMonth } from './dashboardService';

describe('currentMonth', () => {
  it('usa el mes de Managua, no el de UTC', () => {
    // 1 de noviembre 03:00 UTC sigue siendo 31 de octubre en Managua (UTC-6).
    expect(currentMonth(new Date('2026-11-01T03:00:00Z'))).toBe('2026-10');
    expect(currentMonth(new Date('2026-11-01T07:00:00Z'))).toBe('2026-11');
  });
});
