import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Badge, Button, Card, CardTitle, PageHeader, TextField, useToast } from '@/components/ui';
import { ROLE_LABELS, useRequiredCurrentUser } from '@/features/acceso';
import { toUserMessage } from '@/lib/errors';
import { CasilleroCard } from '../components/CasilleroCard';
import { NameTakenError, useUpdateProfile } from '../hooks/useUpdateProfile';
import { profileSchema, type ProfileFormValues, type ProfileValues } from '../schemas';

/** RF-08: ver y editar perfil y ver el casillero. */
export function PerfilPage() {
  const user = useRequiredCurrentUser();
  const toast = useToast();
  const update = useUpdateProfile(user);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues, unknown, ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
      lastName: user.lastName,
      address: user.address ?? '',
      phone: user.phone ?? '',
    },
  });

  const onSubmit = handleSubmit((values) =>
    update.mutate(values, {
      onSuccess: (saved) => {
        reset(saved);
        toast.success('Tus datos se guardaron.');
      },
      onError: (error) => {
        if (error instanceof NameTakenError) setError('lastName', { message: error.message });
        else toast.error(toUserMessage(error, 'No pudimos guardar tus datos.'));
      },
    }),
  );

  return (
    <>
      <PageHeader title="Mi perfil" description="Tus datos de contacto y de entrega." />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="flex flex-col gap-6">
          {user.role === 'cliente' ? (
            <CasilleroCard casillero={user.casillero} />
          ) : (
            <Card>
              <p className="text-sm text-slate-500">Rol</p>
              <Badge tone="brand" className="mt-2 text-sm">
                {ROLE_LABELS[user.role]}
              </Badge>
            </Card>
          )}
          <Card>
            <CardTitle>Cuenta</CardTitle>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-slate-500">Correo electrónico</dt>
                <dd className="font-medium break-all text-ink-900">{user.email}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Contraseña</dt>
                <dd className="text-ink-900">
                  Para cambiarla, cierra sesión y usa «¿Olvidaste tu contraseña?».
                </dd>
              </div>
            </dl>
          </Card>
        </div>

        <Card>
          <CardTitle>Datos personales</CardTitle>
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                label="Nombre"
                autoComplete="given-name"
                error={errors.name?.message}
                {...register('name')}
              />
              <TextField
                label="Apellido"
                autoComplete="family-name"
                error={errors.lastName?.message}
                {...register('lastName')}
              />
            </div>
            <TextField
              label="Dirección de entrega"
              autoComplete="street-address"
              placeholder="Ciudad, barrio y señas"
              hint="Se usa cuando pides delivery a domicilio."
              error={errors.address?.message}
              {...register('address')}
            />
            <TextField
              label="Teléfono"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="8888 8888"
              error={errors.phone?.message}
              {...register('phone')}
            />
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="ghost" disabled={!isDirty || update.isPending} onClick={() => reset()}>
                Descartar cambios
              </Button>
              <Button type="submit" loading={update.isPending} disabled={!isDirty}>
                Guardar cambios
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}
