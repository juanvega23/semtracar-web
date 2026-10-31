import type { ComponentProps, ReactNode } from 'react';
import { cn } from './cn';

export function Card({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section
      className={cn('rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6', className)}
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
      <h2 className="text-lg font-semibold text-ink-900">{children}</h2>
      {action}
    </div>
  );
}
