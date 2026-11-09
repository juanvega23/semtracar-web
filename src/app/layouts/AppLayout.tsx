import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { BellIcon, CloseIcon, cn, LockIcon, Logo, LogoutIcon, MenuIcon, UserIcon } from '@/components/ui';
import { useRequiredCurrentUser } from '@/features/acceso';
import { unreadBadge, useUnreadCount } from '@/features/avisos';
import { formatFullName } from '@/lib/format';
import { navFor } from '../navigation';
import { useLogout, userSubtitle } from './session';
import { UserAvatar, UserMenu } from './UserMenu';

/** Diseño de las pantallas con sesión: encabezado con menú por rol, avisos y usuario. Responsive. */
export function AppLayout() {
  const user = useRequiredCurrentUser();
  const items = navFor(user.role);
  const isClient = user.role === 'cliente';
  const unread = useUnreadCount(user.id).data ?? 0;
  const badge = unreadBadge(unread);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { logout, pending } = useLogout();
  const [lastPath, setLastPath] = useState(location.pathname);

  // Cierra el menú móvil al navegar.
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname);
    setMobileOpen(false);
  }

  return (
    <div className={cn('min-h-dvh', user.role !== 'cliente' && 'bg-[#e8e6f5]')}>
      <header className="sticky top-0 z-20 border-b border-ink-900 bg-white">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-4 px-4 xl:h-[103px] xl:px-10">
          <Link to="/" aria-label="Ir al inicio" className="shrink-0">
            <Logo className="h-10 xl:h-[56px]" />
          </Link>

          <nav
            aria-label="Principal"
            className="ml-2 hidden h-full items-stretch gap-1 min-[1400px]:ml-10 min-[1400px]:gap-3 xl:flex"
          >
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 border-b-4 px-2 font-bold transition-colors',
                    isClient ? 'text-lg min-[1400px]:min-w-[158px] min-[1400px]:text-xl' : 'text-[15px]',
                    isActive
                      ? 'border-brand-600 text-brand-600'
                      : 'border-transparent text-[#8e8e93] hover:text-ink-900',
                    item.access === 'locked' && !isActive && 'text-slate-400',
                  )
                }
              >
                <item.icon size={isClient ? 26 : 20} />
                {item.label}
                {item.access === 'locked' && <LockIcon size={14} aria-label="Bloqueado" />}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 min-[1400px]:gap-6 sm:gap-4">
            <NavLink
              to="/avisos"
              aria-label={badge ? `Avisos: ${unread} sin leer` : 'Avisos'}
              className={({ isActive }) =>
                cn(
                  'relative rounded-lg p-2.5 hover:bg-slate-100',
                  isActive ? 'text-brand-600' : 'text-ink-900',
                )
              }
            >
              <BellIcon size={32} />
              {badge && (
                <span
                  aria-hidden="true"
                  className="absolute top-0.5 right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-[11px] font-bold text-white tabular-nums"
                >
                  {badge}
                </span>
              )}
            </NavLink>
            <div className="hidden xl:block">
              <UserMenu user={user} />
            </div>
            <button
              type="button"
              className="rounded-xl p-2.5 text-ink-800 hover:bg-slate-50 xl:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-expanded={mobileOpen}
              aria-controls="menu-movil"
              aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              {mobileOpen ? <CloseIcon size={24} /> : <MenuIcon size={24} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div id="menu-movil" className="border-t border-slate-200 bg-white px-4 pt-3 pb-5 xl:hidden">
            <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
              <UserAvatar />
              <div className="leading-tight">
                <p className="font-semibold text-ink-900">
                  {formatFullName({ name: user.name, last_name: user.lastName })}
                </p>
                <p className="text-sm text-slate-500">{userSubtitle(user)}</p>
              </div>
            </div>
            <nav aria-label="Principal" className="flex flex-col">
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-xl px-3 py-3 font-medium',
                      isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-800',
                      item.access === 'locked' && 'text-slate-400',
                    )
                  }
                >
                  <item.icon size={20} />
                  {item.label}
                  {item.access === 'locked' && (
                    <LockIcon size={15} className="ml-auto" aria-label="Bloqueado" />
                  )}
                </NavLink>
              ))}
              <NavLink
                to="/perfil"
                className="flex items-center gap-3 rounded-xl px-3 py-3 font-medium text-ink-800"
              >
                <UserIcon size={20} /> Mi perfil
              </NavLink>
              <button
                type="button"
                onClick={logout}
                disabled={pending}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-left font-medium text-red-600 disabled:opacity-60"
              >
                <LogoutIcon size={20} /> Cerrar sesión
              </button>
            </nav>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-[1440px] px-4 py-5 xl:px-10">
        <Outlet />
      </main>
    </div>
  );
}
