import { unreadBadge } from './notificationsService';

describe('unreadBadge', () => {
  it('no muestra indicador sin avisos pendientes', () => {
    expect(unreadBadge(0)).toBeNull();
  });

  it('muestra la cantidad y no crece después de 9', () => {
    expect(unreadBadge(3)).toBe('3');
    expect(unreadBadge(9)).toBe('9');
    expect(unreadBadge(10)).toBe('9+');
  });
});
