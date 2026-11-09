import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Button,
  Card,
  IconInput,
  MailIcon,
  MapPinIcon,
  PhoneCallIcon,
  UserIcon,
  useToast,
} from '@/components/ui';
import { useRequiredCurrentUser } from '@/features/acceso';
import { toUserMessage } from '@/lib/errors';
import { NameTakenError, useUpdateProfile } from '../hooks/useUpdateProfile';
import { profileSchema, type ProfileFormValues, type ProfileValues } from '../schemas';

/** RF-08: ver y editar el perfil. El casillero se ve en el encabezado. */
export function PerfilPage() {
  const user = useRequiredCurrentUser();
  const toast = useToast();
  const update = useUpdateProfile(user);
  const [editing, setEditing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
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
        setEditing(false);
        toast.success('Tus datos se guardaron.');
      },
      onError: (error) => {
        if (error instanceof NameTakenError) setError('lastName', { message: error.message });
        else toast.error(toUserMessage(error, 'No pudimos guardar tus datos.'));
      },
    }),
  );

  const fieldProps = { floating: true, muted: !editing, readOnly: !editing };

  return (
    <div className="mx-auto max-w-[418px] pt-4 lg:pt-12">
      <Card className="px-6 py-7 sm:px-9">
        <h1 className="text-[25px] font-bold text-brand-600">Información personal</h1>
        <form onSubmit={onSubmit} noValidate className="mt-8 flex flex-col gap-5">
          <IconInput
            label="Nombre"
            icon={<UserIcon size={28} />}
            autoComplete="given-name"
            error={errors.name?.message}
            {...fieldProps}
            {...register('name')}
          />
          <IconInput
            label="Apellido"
            icon={<UserIcon size={28} />}
            autoComplete="family-name"
            error={errors.lastName?.message}
            {...fieldProps}
            {...register('lastName')}
          />
          <IconInput
            label="Correo electrónico"
            icon={<MailIcon size={28} />}
            value={user.email}
            floating
            muted
            readOnly
          />
          <IconInput
            label="Dirección de entrega"
            icon={<MapPinIcon size={28} />}
            autoComplete="street-address"
            hint="Se usará para delivery de paquetes"
            error={errors.address?.message}
            {...fieldProps}
            {...register('address')}
          />
          <IconInput
            label="Teléfono"
            icon={<PhoneCallIcon size={28} />}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            hint="Para contactarte en el delivery"
            error={errors.phone?.message}
            {...fieldProps}
            {...register('phone')}
          />
          {editing ? (
            <div className="mt-2 flex flex-col gap-2">
              <Button
                type="submit"
                variant="secondary"
                fullWidth
                loading={update.isPending}
                className="h-[67px]! rounded-full! text-xl! uppercase"
              >
                Guardar cambios
              </Button>
              <Button
                variant="ghost"
                fullWidth
                disabled={update.isPending}
                onClick={() => {
                  reset();
                  setEditing(false);
                }}
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <Button
              variant="secondary"
              fullWidth
              className="mt-2 h-[67px]! rounded-full! text-2xl! uppercase"
              onClick={() => setEditing(true)}
            >
              Editar perfil
            </Button>
          )}
        </form>
      </Card>
    </div>
  );
}
