import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../utils/cn';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'xs' | 'sm' | 'md';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  variant?: Variant;
  size?: Size;
  type?: 'button' | 'submit' | 'reset';
  children: ReactNode;
}

const BASE =
  'rounded cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accent/80',
  secondary: 'border border-border text-text-muted hover:text-text hover:tint-5',
  danger: 'bg-danger text-white hover:bg-danger/80',
  ghost: 'text-text-muted hover:text-text hover:tint-5',
};

const SIZES: Record<Size, string> = {
  xs: 'px-3 py-1.5 text-xs',
  sm: 'px-3 py-1 text-sm',
  md: 'px-4 py-1.5 text-sm',
};

export function Button({
  variant = 'primary',
  size = 'sm',
  type = 'button',
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button type={type} className={cn(BASE, VARIANTS[variant], SIZES[size], className)} {...rest}>
      {children}
    </button>
  );
}
