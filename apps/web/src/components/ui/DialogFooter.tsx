import type { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

type FooterVariant = 'inline' | 'bleed';
type FooterAlign = 'end' | 'start' | 'between';

interface DialogFooterProps extends HTMLAttributes<HTMLDivElement> {
  variant?: FooterVariant;
  align?: FooterAlign;
}

const alignClass: Record<FooterAlign, string> = {
  end: 'justify-end',
  start: 'justify-start',
  between: 'justify-between',
};

const variantClass: Record<FooterVariant, string> = {
  inline: 'pt-2 border-t border-border',
  bleed: '-mx-4 -mb-4 px-4 py-3 border-t border-border mt-2',
};

export function DialogFooter({
  variant = 'inline',
  align = 'end',
  className,
  children,
  ...rest
}: DialogFooterProps): React.JSX.Element {
  return (
    <div
      {...rest}
      className={cn('flex gap-2', alignClass[align], variantClass[variant], className)}
    >
      {children}
    </div>
  );
}
