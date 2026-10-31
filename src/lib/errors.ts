/** Mensajes comprensibles en español para errores de Supabase y de red (RNF-16, RNF-17). */
const KNOWN_MESSAGES: Array<[RegExp, string]> = [
  [/invalid login credentials/i, 'Correo o contraseña incorrectos.'],
  [/email not confirmed/i, 'Confirma tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.'],
  [/user already registered/i, 'Este correo ya está registrado.'],
  [/password should be at least/i, 'La contraseña es demasiado corta.'],
  [/rate limit|too many requests|over_email_send_rate_limit/i, 'Demasiados intentos. Espera unos minutos.'],
  [/failed to fetch|network|fetch failed/i, 'No hay conexión con el servidor. Revisa tu internet.'],
  [/jwt expired|invalid jwt/i, 'Tu sesión expiró. Vuelve a iniciar sesión.'],
  [/no autorizado|permission denied|row-level security/i, 'No tienes permiso para realizar esta acción.'],
];

export function toUserMessage(error: unknown, fallback = 'Ocurrió un error. Intenta de nuevo.'): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message: unknown }).message)
        : typeof error === 'string'
          ? error
          : '';

  for (const [pattern, message] of KNOWN_MESSAGES) {
    if (pattern.test(raw)) return message;
  }
  return fallback;
}
