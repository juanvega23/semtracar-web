import { useId, useState, type ComponentProps, type ReactNode } from 'react';
import { cn } from './cn';
import { EyeIcon, EyeOffIcon } from './icons';

type ShellProps = {
  id: string;
  label: string;
  /** Muestra la etiqueta sobre el borde; si no, solo la leen los lectores de pantalla. */
  floating?: boolean;
  icon: ReactNode;
  compact?: boolean;
  muted?: boolean;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
  trailing?: ReactNode;
};

/** Campo del diseño en Figma: ícono a la izquierda y etiqueta opcional sobre el borde. */
function Shell({ id, label, floating, icon, compact, muted, error, hint, children, trailing }: ShellProps) {
  return (
    <div>
      <div
        className={cn(
          'relative flex items-center rounded-[10px] border bg-white transition-colors focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-100',
          compact ? 'h-[52px]' : 'h-[67px]',
          error ? 'border-red-400' : 'border-[#8e8e93]/70',
        )}
      >
        <label
          htmlFor={id}
          className={
            floating
              ? cn(
                  'absolute -top-2.5 left-4 bg-white px-1.5 text-sm leading-none font-semibold',
                  muted ? 'text-[#b9b9c3]' : 'text-[#8e8e93]',
                )
              : 'sr-only'
          }
        >
          {label}
        </label>
        <span
          aria-hidden="true"
          className={cn('flex shrink-0 pr-3 pl-4', muted ? 'text-[#b9b9c3]' : 'text-brand-600')}
        >
          {icon}
        </span>
        {children}
        {trailing}
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1 pl-4 text-sm text-red-600">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1 pl-4 text-sm font-semibold text-[#b9b9c3]">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

const controlClass = (compact?: boolean, muted?: boolean) =>
  cn(
    'h-full w-full min-w-0 rounded-[10px] bg-transparent pr-4 outline-none placeholder:text-[#8e8e93]',
    compact ? 'text-base' : 'text-lg font-semibold',
    muted ? 'text-[#b9b9c3]' : 'text-ink-900',
  );

export type IconInputProps = Omit<ComponentProps<'input'>, 'id'> & {
  label: string;
  floating?: boolean;
  icon: ReactNode;
  compact?: boolean;
  muted?: boolean;
  error?: string;
  hint?: ReactNode;
};

export function IconInput({
  label,
  floating,
  icon,
  compact,
  muted,
  error,
  hint,
  type,
  ...props
}: IconInputProps) {
  const id = useId();
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  return (
    <Shell
      id={id}
      label={label}
      floating={floating}
      icon={icon}
      compact={compact}
      muted={muted}
      error={error}
      hint={hint}
      trailing={
        isPassword && (
          <button
            type="button"
            onClick={() => setShow((value) => !value)}
            aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="flex shrink-0 pr-4 text-ink-700 hover:text-ink-900"
          >
            {show ? <EyeIcon size={22} /> : <EyeOffIcon size={22} />}
          </button>
        )
      }
    >
      <input
        id={id}
        type={isPassword && show ? 'text' : type}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={controlClass(compact, muted)}
        {...props}
      />
    </Shell>
  );
}

export type IconSelectProps = Omit<ComponentProps<'select'>, 'id'> & {
  label: string;
  icon: ReactNode;
  error?: string;
};

export function IconSelect({ label, icon, error, children, ...props }: IconSelectProps) {
  const id = useId();
  return (
    <Shell
      id={id}
      label={label}
      floating
      icon={icon}
      error={error}
      trailing={
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-5 -mt-[3px] border-x-[7px] border-t-[7px] border-x-transparent border-t-ink-900"
        />
      }
    >
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(controlClass(), 'appearance-none pr-10')}
        {...props}
      >
        {children}
      </select>
    </Shell>
  );
}
