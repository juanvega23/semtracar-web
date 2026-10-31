import { useId, useState, type ComponentProps, type ReactNode } from 'react';
import { cn } from './cn';
import { EyeIcon, EyeOffIcon } from './icons';

type FieldShellProps = {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  children: ReactNode;
};

function FieldShell({ id, label, error, hint, required, children }: FieldShellProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink-800">
        {label}
        {required && <span className="text-brand-600"> *</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-sm text-slate-500">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

const controlClass = (hasError: boolean) =>
  cn(
    'h-11 w-full rounded-xl border bg-white px-3.5 text-base text-ink-900 placeholder:text-slate-400 sm:text-sm',
    'transition-colors focus:border-brand-500 focus:ring-4 focus:ring-brand-100 focus:outline-none',
    'disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500',
    hasError ? 'border-red-400' : 'border-slate-300',
  );

export type TextFieldProps = Omit<ComponentProps<'input'>, 'id'> & {
  label: string;
  error?: string;
  hint?: ReactNode;
};

export function TextField({ label, error, hint, required, className, type, ...props }: TextFieldProps) {
  const id = useId();
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <FieldShell id={id} label={label} error={error} hint={hint} required={required}>
      <div className="relative">
        <input
          id={id}
          type={isPassword && showPassword ? 'text' : type}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={cn(controlClass(Boolean(error)), isPassword && 'pr-11', className)}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 hover:text-ink-800"
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
          </button>
        )}
      </div>
    </FieldShell>
  );
}

export type SelectFieldProps = Omit<ComponentProps<'select'>, 'id'> & {
  label: string;
  error?: string;
  hint?: ReactNode;
};

export function SelectField({
  label,
  error,
  hint,
  required,
  className,
  children,
  ...props
}: SelectFieldProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} required={required}>
      <select
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cn(controlClass(Boolean(error)), 'pr-8', className)}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
}

export type CheckboxProps = Omit<ComponentProps<'input'>, 'id' | 'type'> & {
  label: ReactNode;
  error?: string;
};

export function Checkbox({ label, error, className, ...props }: CheckboxProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-start gap-2.5">
        <input
          id={id}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn('mt-0.5 size-4.5 shrink-0 rounded accent-brand-500', className)}
          {...props}
        />
        <label htmlFor={id} className="text-sm text-ink-700">
          {label}
        </label>
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
