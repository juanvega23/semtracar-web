import type { ReactNode } from 'react';
import { Button } from './Button';
import { cn } from './cn';
import { AlertIcon, InboxIcon, LockIcon } from './icons';
import { Spinner } from './Spinner';

/** Estados de carga, vacío, error y bloqueo (RNF-16, RNF-17, RF-66). */

export function LoadingState({ message = 'Cargando…', className }: { message?: string; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-16 text-slate-500', className)}>
      <Spinner className="text-brand-500" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

type StateBoxProps = {
  icon: ReactNode;
  iconClass: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

function StateBox({ icon, iconClass, title, description, action, className }: StateBoxProps) {
  return (
    <div className={cn('flex flex-col items-center px-4 py-14 text-center', className)}>
      <div className={cn('mb-4 flex size-14 items-center justify-center rounded-2xl', iconClass)}>{icon}</div>
      <h3 className="text-base font-semibold text-ink-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function EmptyState(props: Omit<StateBoxProps, 'icon' | 'iconClass'> & { icon?: ReactNode }) {
  return (
    <StateBox
      icon={props.icon ?? <InboxIcon size={26} />}
      iconClass="bg-slate-100 text-slate-500"
      {...props}
    />
  );
}

export function ErrorState({
  title = 'No pudimos cargar la información',
  description = 'Revisa tu conexión e intenta de nuevo.',
  onRetry,
  className,
}: {
  title?: string;
  description?: ReactNode;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <StateBox
      icon={<AlertIcon size={26} />}
      iconClass="bg-red-50 text-red-600"
      title={title}
      description={description}
      className={className}
      action={
        onRetry && (
          <Button variant="outline" onClick={onRetry}>
            Reintentar
          </Button>
        )
      }
    />
  );
}

/** Sección visible pero bloqueada con candado para el rol actual (RF-66). */
export function LockedState({
  title = 'Sección bloqueada',
  description = 'Tu rol no tiene acceso a esta sección. Si lo necesitas, pide acceso a un administrador.',
  className,
}: {
  title?: string;
  description?: ReactNode;
  className?: string;
}) {
  return (
    <StateBox
      icon={<LockIcon size={26} />}
      iconClass="bg-amber-50 text-amber-700"
      title={title}
      description={description}
      className={className}
    />
  );
}
