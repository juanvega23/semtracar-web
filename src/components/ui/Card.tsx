import type { ComponentProps, ReactNode } from 'react';
import { cn } from './cn';

export function Card({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section
      className={cn(
        'rounded-xl border border-slate-200 bg-white shadow-[0_2px_6px_rgba(33,40,75,0.08)]',
        // cn no resuelve conflictos: una tarjeta con su propio padding no recibe el predeterminado.
        !/(^|\s)p-\d/.test(className ?? '') && 'p-5',
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({
  children,
  action,
  className,
}: {
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-4 flex items-center justify-between gap-3', className)}>
      <h2 className="text-base font-bold text-slate-600 uppercase">{children}</h2>
      {action}
    </div>
  );
}
