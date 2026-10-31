import type { ComponentProps, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router';
import { buttonClass, type ButtonSize, type ButtonVariant } from './buttonStyles';
import { Spinner } from './Spinner';

export type ButtonProps = ComponentProps<'button'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Muestra un spinner y deshabilita el botón (evita doble envío, RNF-26). */
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
};

export function Button({
  variant,
  size,
  loading = false,
  icon,
  fullWidth,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClass({ variant, size, fullWidth, className })}
      {...props}
    >
      {loading ? <Spinner label="Enviando" /> : icon}
      {children}
    </button>
  );
}

/** Enlace de navegación con apariencia de botón. */
export function ButtonLink({
  variant,
  size,
  fullWidth,
  icon,
  className,
  children,
  ...props
}: LinkProps & { variant?: ButtonVariant; size?: ButtonSize; fullWidth?: boolean; icon?: ReactNode }) {
  return (
    <Link className={buttonClass({ variant, size, fullWidth, className })} {...props}>
      {icon}
      {children}
    </Link>
  );
}
