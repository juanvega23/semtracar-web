import type { ReactNode } from 'react';
import { AlertIcon, CheckIcon, cn } from '@/components/ui';

export function FormAlert({ tone, children }: { tone: 'error' | 'success'; children: ReactNode }) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm',
        tone === 'error'
          ? 'border-red-200 bg-red-50 text-red-800'
          : 'border-emerald-200 bg-emerald-50 text-emerald-800',
      )}
    >
      <span className="mt-0.5 shrink-0">
        {tone === 'error' ? <AlertIcon size={18} /> : <CheckIcon size={18} />}
      </span>
      <div>{children}</div>
    </div>
  );
}
