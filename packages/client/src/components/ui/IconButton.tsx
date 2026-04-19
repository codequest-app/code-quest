import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';
import { cn } from '../../utils/cn';

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  type?: 'button' | 'submit' | 'reset';
  children: ReactNode;
  ref?: Ref<HTMLButtonElement>;
}

const BASE =
  'w-6 h-6 flex items-center justify-center rounded text-text-bright hover:bg-white/5 transition-colors';

export function IconButton({
  type = 'button',
  className,
  children,
  ref,
  ...rest
}: IconButtonProps) {
  return (
    <button ref={ref} type={type} className={cn(BASE, className)} {...rest}>
      {children}
    </button>
  );
}
