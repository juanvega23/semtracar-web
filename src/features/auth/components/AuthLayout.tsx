import type { ReactNode } from 'react';
import { Link } from 'react-router';
import loginBg from '@/assets/login-bg.jpg';
import { Logo } from '@/components/ui';

/** Fondo, marca y tarjeta del diseño de inicio de sesión en Figma. */
export function AuthLayout({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div
      className="min-h-dvh bg-[#eceaf3] bg-cover bg-fixed bg-center"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      <div className="grid min-h-dvh items-center gap-6 px-4 py-8 lg:grid-cols-[46%_36%] lg:gap-0 lg:px-0">
        <aside className="lg:mt-[27vh] lg:self-start lg:pl-[8.7vw]">
          <Link to="/" aria-label="Ir al inicio" className="inline-block">
            <Logo className="h-14 lg:h-[100px] lg:w-[380px] lg:object-contain" />
          </Link>
          <div className="hidden lg:block">
            <h2 className="mt-8 text-[33px] leading-tight font-bold text-ink-900">
              Trazabilidad y control
              <br />
              en <span className="text-brand-600">cada envío</span>
            </h2>
            <p className="mt-8 max-w-[370px] text-xl leading-snug text-[#6b6b7b]">
              Inicia sesión para gestionar, supervisar y dar seguimiento a tus envíos desde un solo lugar.
            </p>
          </div>
        </aside>

        <main className="mx-auto w-full max-w-[516px] rounded-xl bg-white px-6 py-10 shadow-[0_2px_8px_rgba(33,40,75,0.2)] sm:px-[76px] sm:py-12">
          <h1 className="text-center text-[33px] font-bold text-ink-900">{title}</h1>
          {description && <p className="mt-4 text-center text-[#8e8e93]">{description}</p>}
          <div className="mt-6">{children}</div>
          {footer && <div className="mt-8 text-center font-semibold text-[#6b6b7b]">{footer}</div>}
        </main>
      </div>
    </div>
  );
}
