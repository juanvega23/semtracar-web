import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router';
import { AtIcon, Button, IconInput, LockIcon } from '@/components/ui';
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
      description="Ingresa tus credenciales para continuar"
      footer={
        <>
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="font-bold text-brand-600 hover:text-brand-700">
            Regístrate
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        {signIn.isError && <FormAlert tone="error">{toUserMessage(signIn.error)}</FormAlert>}
        <IconInput
          compact
          label="Correo electrónico"
          placeholder="Correo electrónico"
          icon={<AtIcon size={24} />}
          type="email"
          autoComplete="email"
          inputMode="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <div className="flex flex-col gap-4">
          <IconInput
            compact
            label="Contraseña"
            placeholder="Contraseña"
            icon={<LockIcon size={24} />}
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <Link to="/recuperar" className="self-end font-bold text-brand-600 hover:text-brand-700">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <Button
          type="submit"
          variant="gradient"
          size="lg"
          fullWidth
          loading={signIn.isPending}
          className="mt-5 h-[50px]! text-xl!"
        >
          Iniciar sesión
        </Button>
      </form>
    </AuthLayout>
  );
}
