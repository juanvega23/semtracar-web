import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';
import { Button, TextField } from '@/components/ui';
import { toUserMessage } from '@/lib/errors';
import { AuthLayout } from '../components/AuthLayout';
import { FormAlert } from '../components/FormAlert';
import { useRequestPasswordReset } from '../hooks/useAuthActions';
import { forgotPasswordSchema, type ForgotPasswordValues } from '../schemas';

/** RF-06: recuperar contraseña por correo. */
export function ForgotPasswordPage() {
  const reset = useRequestPasswordReset();
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = handleSubmit((v) => reset.mutate(v.email.trim().toLowerCase()));

  return (
    <AuthLayout
      title="Recuperar contraseña"
      description="Te enviaremos un enlace para crear una contraseña nueva."
      footer={
        <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
          Volver a iniciar sesión
        </Link>
      }
    >
      {reset.isSuccess ? (
        // Mismo mensaje exista o no el correo, para no revelar quién está registrado.
        <FormAlert tone="success">
          Si <strong>{getValues('email')}</strong> está registrado, recibirás un enlace en unos minutos.
          Revisa también la carpeta de spam.
        </FormAlert>
      ) : (
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
          {reset.isError && <FormAlert tone="error">{toUserMessage(reset.error)}</FormAlert>}
          <TextField
            label="Correo electrónico"
            type="email"
            autoComplete="email"
            inputMode="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <Button type="submit" size="lg" fullWidth loading={reset.isPending}>
            Enviar enlace
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
