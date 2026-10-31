import { z } from 'zod';

const email = z
  .string()
  .trim()
  .min(1, 'Escribe tu correo.')
  .email('Escribe un correo válido.')
  .transform((v) => v.toLowerCase());

const password = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres.')
  .max(72, 'La contraseña es demasiado larga.')
  .regex(/[A-Za-z]/, 'Incluye al menos una letra.')
  .regex(/\d/, 'Incluye al menos un número.');

const personName = (label: string) =>
  z
    .string()
    .trim()
    .min(2, `Escribe tu ${label}.`)
    .max(60, `El ${label} es demasiado largo.`)
    .regex(/^[\p{L}' -]+$/u, `El ${label} solo puede tener letras.`);

/** Teléfono de Nicaragua: 8 dígitos, con o sin +505 y guion. */
const phone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, '').replace(/^\+?505/, ''))
  .pipe(z.string().regex(/^\d{8}$/, 'Escribe un teléfono de 8 dígitos.'));

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Escribe tu contraseña.'),
});
export type LoginValues = z.input<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: personName('nombre'),
    lastName: personName('apellido'),
    email,
    password,
    confirmPassword: z.string(),
    address: z.string().trim().min(5, 'Escribe tu dirección.').max(250, 'La dirección es demasiado larga.'),
    phone,
    acceptTerms: z.boolean().refine((v) => v, 'Debes aceptar los términos y la política de privacidad.'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Las contraseñas no coinciden.',
  });
export type RegisterFormValues = z.input<typeof registerSchema>;
export type RegisterValues = z.output<typeof registerSchema>;

export const forgotPasswordSchema = z.object({ email });
export type ForgotPasswordValues = z.input<typeof forgotPasswordSchema>;

export const newPasswordSchema = z
  .object({ password, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Las contraseñas no coinciden.',
  });
export type NewPasswordValues = z.input<typeof newPasswordSchema>;

export { phone as phoneSchema, personName as personNameSchema };
