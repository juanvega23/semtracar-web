import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { CheckIcon, Logo } from '@/components/ui';

const BENEFITS = [
  'Tu casillero en EE. UU. para comprar en línea',
  'Rastreo de cada paquete hasta Nicaragua',
  'Recibos, pagos y delivery a domicilio',
];

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
    <div className="grid min-h-dvh bg-white lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative hidden overflow-hidden bg-ink-900 p-12 text-white lg:flex lg:flex-col">
        <div
          aria-hidden="true"
          className="absolute -top-40 -left-32 size-[34rem] rounded-full border-[3rem] border-brand-500/90"
        />
        <div
          aria-hidden="true"
          className="absolute -top-36 -left-24 size-[34rem] rounded-full border-[0.6rem] border-accent-500"
        />
        <div className="relative mt-auto">
          <p className="text-sm font-semibold tracking-widest text-brand-300 uppercase">
            Casillero internacional
          </p>
          <h2 className="mt-3 text-4xl leading-tight font-bold">
            De Estados Unidos
            <br />a tu puerta en Nicaragua.
          </h2>
          <ul className="mt-8 space-y-3 text-ink-100">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-center gap-3">
                <span className="flex size-6 items-center justify-center rounded-full bg-brand-500 text-white">
                  <CheckIcon size={14} />
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="flex flex-col px-4 py-8 sm:px-10">
        <Link to="/" className="self-start" aria-label="Ir al inicio">
          <Logo />
        </Link>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <h1 className="text-3xl font-bold tracking-tight text-ink-900">{title}</h1>
          {description && <p className="mt-2 text-slate-600">{description}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 text-center text-sm text-slate-600">{footer}</div>}
        </div>
        <p className="text-center text-xs text-slate-400">
          © {new Date().getFullYear()} SEMTRACAR ·{' '}
          <Link to="/terminos" className="hover:text-ink-700">
            Términos
          </Link>{' '}
          ·{' '}
          <Link to="/privacidad" className="hover:text-ink-700">
            Privacidad
          </Link>
        </p>
      </main>
    </div>
  );
}
