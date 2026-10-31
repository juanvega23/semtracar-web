import logoUrl from '@/assets/logo-semtracar.png';
import { cn } from './cn';

export function Logo({ className }: { className?: string }) {
  return (
    <img
      src={logoUrl}
      alt="SEMTRACAR"
      className={cn('h-10 w-auto select-none', className)}
      draggable={false}
    />
  );
}
