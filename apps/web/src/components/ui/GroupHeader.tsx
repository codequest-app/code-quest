import type { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface GroupHeaderProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function GroupHeader({ className, children, ...rest }: GroupHeaderProps): React.JSX.Element {
  return (
    <div {...rest} className={cn('section-label px-1 pt-2 pb-1 first:pt-0', className)}>
      {children}
    </div>
  );
}
