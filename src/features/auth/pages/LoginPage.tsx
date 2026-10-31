import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router';
import { Button, TextField } from '@/components/ui';
import { toUserMessage } from '@/lib/errors';
import { AuthLayout } from '../components/AuthLayout';
import { FormAlert } from '../components/FormAlert';
import { useSignIn } from '../hooks/useAuthActions';
import { loginSchema, type LoginValues } from '../schemas';

/** RF-05: inicio de sesión con sesión persistente. */
export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';
  const signIn = useSignIn();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit((values) =>
    signIn.mutate(
      { email: values.email.trim().toLowerCase(), password: values.password },
      { onSuccess: () => navigate(from, { replace: true }) },
    ),
  );

  return (
    <AuthLayout
      title="Iniciar sesión"
      description="Entra para rastrear tus paquetes y ver tus recibos."
      footer={
        <>
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="font-semibold text-brand-600 hover:text-brand-700">
            Crea tu casillero
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        {signIn.isError && <FormAlert tone="error">{toUserMessage(signIn.error)}</FormAlert>}
        <TextField
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          inputMode="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <div className="flex flex-col gap-2">
          <TextField
            label="Contraseña"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <Link
            to="/recuperar"
            className="self-end text-sm font-medium text-accent-600 hover:text-accent-700"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <Button type="submit" size="lg" fullWidth loading={signIn.isPending}>
          Entrar
        </Button>
      </form>
    </AuthLayout>
  );
}
