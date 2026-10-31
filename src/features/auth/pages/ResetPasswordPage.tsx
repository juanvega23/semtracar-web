import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { Button, ButtonLink, LoadingState, TextField, useToast } from '@/components/ui';
import { toUserMessage } from '@/lib/errors';
import { AuthLayout } from '../components/AuthLayout';
import { FormAlert } from '../components/FormAlert';
import { useUpdatePassword } from '../hooks/useAuthActions';
import { useSession } from '../hooks/useSession';
import { newPasswordSchema, type NewPasswordValues } from '../schemas';

/** RF-06: destino del enlace del correo (/reset-password). */
export function ResetPasswordPage() {
  const { session, loading } = useSession();
  const navigate = useNavigate();
  const toast = useToast();
  const update = useUpdatePassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewPasswordValues>({ resolver: zodResolver(newPasswordSchema) });

  if (loading) return <LoadingState className="min-h-dvh" />;

  if (!session) {
    return (
      <AuthLayout title="Enlace no válido">
        <FormAlert tone="error">
          El enlace para cambiar la contraseña venció o ya se usó. Pide uno nuevo.
        </FormAlert>
        <ButtonLink to="/recuperar" size="lg" fullWidth className="mt-6">
          Pedir un enlace nuevo
        </ButtonLink>
      </AuthLayout>
    );
  }

  const onSubmit = handleSubmit((v) =>
    update.mutate(v.password, {
      onSuccess: () => {
        toast.success('Tu contraseña se actualizó.');
        navigate('/', { replace: true });
      },
    }),
  );

  return (
    <AuthLayout title="Crea una contraseña nueva" description={`Para la cuenta ${session.user.email ?? ''}.`}>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        {update.isError && <FormAlert tone="error">{toUserMessage(update.error)}</FormAlert>}
        <TextField
          label="Contraseña nueva"
          type="password"
          autoComplete="new-password"
          hint="Mínimo 8 caracteres, con letras y números."
          error={errors.password?.message}
          {...register('password')}
        />
        <TextField
          label="Confirmar contraseña"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Button type="submit" size="lg" fullWidth loading={update.isPending}>
          Guardar contraseña
        </Button>
      </form>
    </AuthLayout>
  );
}
