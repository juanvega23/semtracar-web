import type { ComponentProps } from 'react';
import { cn } from './cn';

/** Tabla responsiva: en pantallas pequeñas se desplaza horizontalmente dentro de su contenedor. */
export function Table({ className, ...props }: ComponentProps<'table'>) {
  return (
    <div className="-mx-5 overflow-x-auto sm:mx-0">
      <table className={cn('w-full min-w-[640px] text-left text-sm', className)} {...props} />
    </div>
  );
}

export function Th({ className, ...props }: ComponentProps<'th'>) {
  return (
    <th
      scope="col"
      className={cn(
        'border-b border-slate-200 px-4 py-3 text-xs font-semibold tracking-wide text-slate-500 uppercase',
        className,
      )}
      {...props}
    />
  );
}

export function Td({ className, ...props }: ComponentProps<'td'>) {
  return <td className={cn('border-b border-slate-100 px-4 py-3 text-ink-800', className)} {...props} />;
}
