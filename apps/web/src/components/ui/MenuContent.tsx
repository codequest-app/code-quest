import type { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface MenuContentProps extends HTMLAttributes<HTMLDivElement> {
  minWidth?: string;
}

export function MenuContent({
  minWidth,
  className,
  style,
  children,
  ...rest
}: MenuContentProps): React.JSX.Element {
  return (
    <div
      {...rest}
      style={minWidth ? { minWidth, ...style } : style}
      className={cn(
        'z-modal rounded border border-border bg-surface shadow-floating py-1',
        className,
      )}
    >
      {children}
    </div>
  );
}

export const menuContentClass =
  'z-modal min-w-45 rounded border border-border bg-surface shadow-floating py-1';
