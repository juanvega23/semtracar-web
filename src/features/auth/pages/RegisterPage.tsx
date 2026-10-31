import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';
import { Button, ButtonLink, Checkbox, TextField } from '@/components/ui';
import { toUserMessage } from '@/lib/errors';
import { AuthLayout } from '../components/AuthLayout';
import { FormAlert } from '../components/FormAlert';
import { useRegister } from '../hooks/useAuthActions';
import { registerSchema, type RegisterFormValues, type RegisterValues } from '../schemas';
import { DuplicateError } from '../services/authService';

/** RF-01 a RF-04 y RNF-42. */
export function RegisterPage() {
  const registerUser = useRegister();
  const [sentTo, setSentTo] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormValues, unknown, RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { acceptTerms: false },
  });

  const onSubmit = handleSubmit((v) =>
    registerUser.mutate(
      {
        name: v.name,
        lastName: v.lastName,
        email: v.email,
        password: v.password,
        address: v.address,
        phone: v.phone,
      },
      {
        onSuccess: () => setSentTo(v.email),
        onError: (error) => {
          if (error instanceof DuplicateError) {
            if (error.field === 'email') setError('email', { message: error.message }, { shouldFocus: true });
            else setError('lastName', { message: error.message }, { shouldFocus: true });
          }
        },
      },
    ),
  );

  if (sentTo) {
    return (
      <AuthLayout title="Revisa tu correo" description="Tu casillero está casi listo.">
        <FormAlert tone="success">
          Te enviamos un enlace de confirmación a <strong>{sentTo}</strong>. Ábrelo para activar tu cuenta y
          luego inicia sesión. Tu número de casillero aparecerá en tu perfil.
        </FormAlert>
        <ButtonLink to="/login" size="lg" fullWidth className="mt-6">
          Ir a iniciar sesión
        </ButtonLink>
      </AuthLayout>
    );
  }

  const generalError =
    registerUser.isError && !(registerUser.error instanceof DuplicateError)
      ? toUserMessage(registerUser.error, 'No pudimos crear tu cuenta. Intenta de nuevo.')
      : null;

  return (
    <AuthLayout
      title="Crea tu casillero"
      description="Regístrate gratis y recibe tus compras de EE. UU. en Nicaragua."
      footer={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
            Inicia sesión
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        {generalError && <FormAlert tone="error">{generalError}</FormAlert>}
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Nombre"
            autoComplete="given-name"
            required
            error={errors.name?.message}
            {...register('name')}
          />
          <TextField
            label="Apellido"
            autoComplete="family-name"
            required
            error={errors.lastName?.message}
            {...register('lastName')}
          />
        </div>
        <TextField
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          error={errors.email?.message}
          {...register('email')}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Contraseña"
            type="password"
            autoComplete="new-password"
            required
            hint="Mínimo 8 caracteres, con letras y números."
            error={errors.password?.message}
            {...register('password')}
          />
          <TextField
            label="Confirmar contraseña"
            type="password"
            autoComplete="new-password"
            required
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
        </div>
        <TextField
          label="Dirección"
          autoComplete="street-address"
          required
          placeholder="Ciudad, barrio y señas"
          error={errors.address?.message}
          {...register('address')}
        />
        <TextField
          label="Teléfono"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          required
          placeholder="8888 8888"
          error={errors.phone?.message}
          {...register('phone')}
        />
        <Checkbox
          label={
            <>
              Acepto los{' '}
              <Link to="/terminos" target="_blank" className="font-medium text-accent-600 underline">
                términos y condiciones
              </Link>{' '}
              y la{' '}
              <Link to="/privacidad" target="_blank" className="font-medium text-accent-600 underline">
                política de privacidad
              </Link>
              .
            </>
          }
          error={errors.acceptTerms?.message}
          {...register('acceptTerms')}
        />
        <Button type="submit" size="lg" fullWidth loading={registerUser.isPending}>
          Crear mi cuenta
        </Button>
      </form>
    </AuthLayout>
  );
}
