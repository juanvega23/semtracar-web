import { toUserMessage } from './errors';

describe('toUserMessage', () => {
  it('traduce errores conocidos de Supabase', () => {
    expect(toUserMessage(new Error('Invalid login credentials'))).toBe('Correo o contraseña incorrectos.');
    expect(toUserMessage({ message: 'new row violates row-level security policy' })).toBe(
      'No tienes permiso para realizar esta acción.',
    );
  });

  it('usa el mensaje genérico si no lo reconoce', () => {
    expect(toUserMessage(new Error('boom'))).toBe('Ocurrió un error. Intenta de nuevo.');
    expect(toUserMessage(undefined, 'No se pudo guardar.')).toBe('No se pudo guardar.');
  });
});
