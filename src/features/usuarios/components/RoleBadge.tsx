import { Badge, type BadgeTone } from '@/components/ui';
import { ROLE_LABELS, type Role } from '@/features/acceso';

const TONES: Record<Role, BadgeTone> = {
  cliente: 'neutral',
  admin: 'brand',
  almacen: 'info',
  repartidor: 'success',
};

export function RoleBadge({ role }: { role: Role }) {
  return <Badge tone={TONES[role]}>{ROLE_LABELS[role]}</Badge>;
}
