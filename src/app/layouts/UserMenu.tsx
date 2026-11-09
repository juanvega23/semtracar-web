import { NavLink } from 'react-router';
import { cn, LogoutIcon, UserIcon } from '@/components/ui';
import type { CurrentUser } from '@/features/acceso';
import { formatFullName } from '@/lib/format';
import { useLogout, userSubtitle } from './session';

export function UserAvatar({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'flex size-[50px] shrink-0 items-center justify-center rounded-full border-[5px] border-current',
        className,
      )}
    >
      <UserIcon size={28} strokeWidth={2.4} />
    </span>
  );
}

/** Usuario del encabezado: enlace al perfil y cerrar sesión desde cualquier pantalla (RF-07). */
export function UserMenu({ user }: { user: CurrentUser }) {
  const { logout, pending } = useLogout();
  return (
    <div className="flex items-center gap-3 min-[1400px]:gap-6">
      <NavLink
        to="/perfil"
        className={({ isActive }) =>
          cn('flex items-center gap-2.5 rounded-lg', isActive ? 'text-brand-600' : 'text-ink-900')
        }
      >
        <UserAvatar />
        <span className="text-left leading-tight">
          <span
            className={cn(
              'block font-bold text-ink-900',
              user.role === 'cliente' ? 'text-lg min-[1400px]:text-2xl' : 'text-base',
            )}
          >
            {formatFullName({ name: user.name, last_name: user.lastName })}
          </span>
          <span
            className={cn(
              'block text-ink-900',
              user.role === 'cliente' ? 'text-base min-[1400px]:text-xl' : 'text-sm',
            )}
          >
            {userSubtitle(user)}
          </span>
        </span>
      </NavLink>
      <button
        type="button"
        onClick={logout}
        disabled={pending}
        aria-label="Cerrar sesión"
        className="rounded-lg text-ink-900 hover:opacity-70 disabled:opacity-60"
      >
        <LogoutIcon size={38} strokeWidth={2.2} />
      </button>
    </div>
  );
}
