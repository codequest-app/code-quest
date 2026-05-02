import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';
import { cn } from '@/utils/cn';
import { focusRing } from './_tokens.ts';
import { Tooltip } from './Tooltip.tsx';

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  type?: 'button' | 'submit' | 'reset';
  /** `'tinted'` (default) applies theme-adaptive hover overlay.
   *  `'plain'` skips the overlay — use when the button has its own strong
   *  background (e.g., SendButton's orange fill) that should not be dimmed. */
  variant?: 'tinted' | 'plain';
  tooltip?: string;
  children: ReactNode;
  ref?: Ref<HTMLButtonElement>;
}

const BOX = cn('w-6 h-6 flex items-center justify-center rounded transition-colors', focusRing);

export function IconButton({
  type = 'button',
  variant = 'tinted',
  tooltip,
  className,
  children,
  ref,
  ...rest
}: IconButtonProps): React.JSX.Element {
  const button = (
    <button
      ref={ref}
      type={type}
      className={cn(BOX, variant === 'tinted' && 'text-text-bright hover:tint-5', className)}
      {...rest}
    >
      {children}
    </button>
  );

  if (!tooltip) return button;
  return <Tooltip content={tooltip}>{button}</Tooltip>;
}
