import type { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

type BadgeVariant = 'default' | 'accent' | 'success' | 'danger' | 'warning' | 'muted';
type BadgeSize = 'sm' | 'xs';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  mono?: boolean;
  size?: BadgeSize;
  border?: boolean;
}

const variantClass: Record<BadgeVariant, string> = {
  default: 'bg-surface text-text border-border',
  accent: 'bg-accent/20 text-accent border-accent/30',
  success: 'bg-success/10 text-success border-success/30',
  danger: 'bg-danger/10 text-danger border-danger/30',
  warning: 'bg-warning/10 text-warning border-warning/30',
  muted: 'tint-10 text-muted border-border',
};

const sizeClass: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-xs',
  xs: 'px-1 py-px text-2xs',
};

export function Badge({
  variant = 'default',
  mono = false,
  size = 'sm',
  border = false,
  className,
  children,
  ...rest
}: BadgeProps): React.JSX.Element {
  return (
    <span
      {...rest}
      className={cn(
        'inline-flex items-center rounded shrink-0',
        sizeClass[size],
        variantClass[variant],
        border && 'border',
        mono && 'font-mono',
        className,
      )}
    >
      {children}
    </span>
  );
}
