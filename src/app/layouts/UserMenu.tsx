import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ChevronDownIcon, cn, LogoutIcon, Spinner, UserIcon } from '@/components/ui';
import type { CurrentUser } from '@/features/acceso';
import { formatFullName } from '@/lib/format';
import { useLogout, userSubtitle } from './session';

export function UserAvatar({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-full bg-ink-900 text-white',
        className,
      )}
    >
      <UserIcon size={20} />
    </span>
  );
}

/** Menú de usuario del encabezado: perfil y cerrar sesión desde cualquier pantalla (RF-07). */
export function UserMenu({ user }: { user: CurrentUser }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { logout, pending } = useLogout();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-3 rounded-xl py-1 pr-2 pl-1 hover:bg-slate-50"
      >
        <UserAvatar />
        <span className="hidden text-left leading-tight lg:block">
          <span className="block font-semibold text-ink-900">
            {formatFullName({ name: user.name, last_name: user.lastName })}
          </span>
          <span className="block text-sm text-slate-500">{userSubtitle(user)}</span>
        </span>
        <ChevronDownIcon
          size={18}
          className={cn('text-slate-500 transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          <Link
            role="menuitem"
            to="/perfil"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-800 hover:bg-slate-50"
          >
            <UserIcon size={18} /> Mi perfil
          </Link>
          <button
            role="menuitem"
            type="button"
            onClick={logout}
            disabled={pending}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            {pending ? <Spinner /> : <LogoutIcon size={18} />} Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
