import type { ReactNode } from 'react';
import { cn } from './cn';

/** Título de sección del diseño: mayúsculas, gris azulado y en negrita. */
export function SectionTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn('text-2xl font-bold text-[#5b6178] uppercase', className)}>{children}</h2>;
}

/** Píldora de estado con fondo suave, como "Pagado" o "Entregado" en el Figma. */
export function StatusPill({
  tone,
  icon,
  children,
  className,
}: {
  tone: 'green' | 'blue' | 'yellow' | 'red' | 'lilac' | 'gray';
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const tones = {
    green: 'bg-[#e0f7e6] text-[#1f9d45]',
    blue: 'bg-[#e3f2ff] text-[#0070d6]',
    yellow: 'bg-[#fff4d6] text-[#9a7400]',
    red: 'bg-[#ffe8e8] text-[#e0262a]',
    lilac: 'bg-[#efeafd] text-[#5b3fd0]',
    gray: 'bg-[#ebebee] text-[#6d7588]',
  };
  return (
    <span
      className={cn(
        'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-bold whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
}

/** Grupo de botones tipo píldora para filtrar una lista. */
export function FilterPills<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          disabled={disabled}
          onClick={() => onChange(option.value)}
          className={cn(
            'h-10 rounded-full border px-4 text-sm font-bold transition-colors disabled:opacity-60',
            option.value === value
              ? 'border-ink-900 bg-ink-900 text-white'
              : 'border-[#dcdce3] bg-white text-[#6d7588] hover:border-ink-900 hover:text-ink-900',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
