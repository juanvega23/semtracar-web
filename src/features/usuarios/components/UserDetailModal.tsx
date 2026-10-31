import { useState, type ReactNode } from 'react';
import { z } from 'zod';
import { Button, Modal, TextField, useToast } from '@/components/ui';
import { phoneSchema } from '@/features/auth';
import { toUserMessage } from '@/lib/errors';
import { formatDate, formatFullName } from '@/lib/format';
import { usePromoteToRepartidor, useSetUserRole } from '../hooks/useUsers';
import type { UserListItem } from '../services/usersService';
import { RoleBadge } from './RoleBadge';

type Action = 'repartidor' | 'almacen' | 'cliente' | null;

const optionalPhone = z.union([z.literal(''), phoneSchema]);

/** RF-60 (consultar), RF-61 (promover a repartidor) y RF-62 (asignar almacén). */
export function UserDetailModal({
  user,
  currentUserId,
  onClose,
}: {
  user: UserListItem | null;
  currentUserId: string;
  onClose: () => void;
}) {
  const toast = useToast();
  const promote = usePromoteToRepartidor();
  const setRole = useSetUserRole();
  const [action, setAction] = useState<Action>(null);
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string>();
  const [lastUserId, setLastUserId] = useState<string | null>(null);

  // Al abrir otro usuario se reinicia la acción pendiente.
  if (user && user.id !== lastUserId) {
    setLastUserId(user.id);
    setAction(null);
    setPhone(user.phone ?? '');
    setPhoneError(undefined);
  }

  if (!user) return null;

  const fullName = formatFullName({ name: user.name, last_name: user.lastName });
  const isSelf = user.id === currentUserId;
  const editable = !isSelf && user.role !== 'admin';
  const pending = promote.isPending || setRole.isPending;

  const done = (message: string) => {
    toast.success(message);
    onClose();
  };
  const failed = (error: unknown) => toast.error(toUserMessage(error, 'No se pudo cambiar el rol.'));

  const confirm = () => {
    if (action === 'repartidor') {
      const parsed = optionalPhone.safeParse(phone);
      if (!parsed.success) {
        setPhoneError(parsed.error.issues[0]?.message);
        return;
      }
      promote.mutate(
        { userId: user.id, phone: parsed.data },
        { onSuccess: () => done(`${fullName} ahora es repartidor.`), onError: failed },
      );
    } else if (action === 'almacen' || action === 'cliente') {
      setRole.mutate(
        { userId: user.id, role: action },
        {
          onSuccess: () =>
            done(
              action === 'almacen'
                ? `${fullName} ahora es encargado de almacén.`
                : `${fullName} ahora es cliente.`,
            ),
          onError: failed,
        },
      );
    }
  };

  const CONFIRM_TEXT: Record<Exclude<Action, null>, string> = {
    repartidor: `${fullName} dejará de usar la web y trabajará desde la app móvil como repartidor.`,
    almacen: `${fullName} podrá registrar paquetes y estados Recibido y En tránsito, sin ver pagos.`,
    cliente: `${fullName} volverá a tener acceso solo a su portal de cliente.`,
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={fullName}
      footer={
        action ? (
          <>
            <Button variant="ghost" onClick={() => setAction(null)} disabled={pending}>
              Volver
            </Button>
            <Button onClick={confirm} loading={pending}>
              Confirmar cambio
            </Button>
          </>
        ) : (
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        )
      }
    >
      {action ? (
        <div className="flex flex-col gap-4">
          <p className="text-slate-700">{CONFIRM_TEXT[action]}</p>
          {action === 'repartidor' && (
            <TextField
              label="Teléfono del repartidor"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setPhoneError(undefined);
              }}
              hint="Opcional. Si lo dejas vacío se conserva el actual."
              error={phoneError}
            />
          )}
        </div>
      ) : (
        <>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <Item label="Rol">
              <RoleBadge role={user.role} />
            </Item>
            <Item label="Casillero">
              <span className="font-mono font-semibold">{user.casillero}</span>
            </Item>
            <Item label="Correo">
              <span className="break-all">{user.email}</span>
            </Item>
            <Item label="Teléfono">{user.phone || 'Sin teléfono'}</Item>
            <Item label="Dirección" wide>
              {user.address || 'Sin dirección'}
            </Item>
            <Item label="Registrado">{formatDate(user.createdAt)}</Item>
          </dl>

          {editable && (
            <div className="mt-6 border-t border-slate-100 pt-5">
              <p className="mb-3 text-sm font-semibold text-ink-900">Cambiar rol</p>
              <div className="flex flex-wrap gap-2">
                {user.role === 'cliente' && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setAction('repartidor')}>
                      Hacer repartidor
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setAction('almacen')}>
                      Asignar almacén
                    </Button>
                  </>
                )}
                {user.role === 'almacen' && (
                  <Button size="sm" variant="outline" onClick={() => setAction('cliente')}>
                    Quitar almacén
                  </Button>
                )}
                {user.role === 'repartidor' && (
                  <Button size="sm" variant="outline" onClick={() => setAction('cliente')}>
                    Devolver a cliente
                  </Button>
                )}
              </div>
            </div>
          )}
          {isSelf && <p className="mt-6 text-sm text-slate-500">No puedes cambiar tu propio rol.</p>}
        </>
      )}
    </Modal>
  );
}

function Item({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? 'sm:col-span-2' : undefined}>
      <dt className="text-slate-500">{label}</dt>
      <dd className="mt-1 text-ink-900">{children}</dd>
    </div>
  );
}
