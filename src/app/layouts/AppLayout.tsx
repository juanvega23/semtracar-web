import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { BellIcon, CloseIcon, cn, LockIcon, Logo, LogoutIcon, MenuIcon, UserIcon } from '@/components/ui';
import { useRequiredCurrentUser } from '@/features/acceso';
import { formatFullName } from '@/lib/format';
import { navFor } from '../navigation';
import { useLogout, userSubtitle } from './session';
import { UserAvatar, UserMenu } from './UserMenu';

/** Diseño de las pantallas con sesión: encabezado con menú por rol, avisos y usuario. Responsive. */
export function AppLayout() {
  const user = useRequiredCurrentUser();
  const items = navFor(user.role);
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
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-18 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link to="/" aria-label="Ir al inicio" className="shrink-0">
            <Logo className="h-9 sm:h-10" />
          </Link>

          <nav aria-label="Principal" className="ml-6 hidden h-full items-stretch gap-1 xl:flex">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 border-b-[3px] px-3 text-[15px] font-medium transition-colors',
                    isActive
                      ? 'border-brand-500 text-brand-600'
                      : 'border-transparent text-slate-600 hover:text-ink-900',
                    item.access === 'locked' && !isActive && 'text-slate-400',
                  )
                }
              >
                <item.icon size={19} />
                {item.label}
                {item.access === 'locked' && <LockIcon size={14} aria-label="Bloqueado" />}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-4">
            <NavLink
              to="/avisos"
              aria-label="Avisos"
              className={({ isActive }) =>
                cn(
                  'relative rounded-xl p-2.5 hover:bg-slate-50',
                  isActive ? 'text-brand-600' : 'text-ink-800',
                )
              }
            >
              <BellIcon size={22} />
            </NavLink>
            <span className="hidden h-8 w-px bg-slate-200 xl:block" aria-hidden="true" />
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

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
