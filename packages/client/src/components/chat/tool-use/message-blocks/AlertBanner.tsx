import type { ReactNode } from 'react';
import { cn } from '../../../../utils/cn';

interface AlertBannerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function AlertBanner({
  className,
  children,
  ...props
}: AlertBannerProps): React.JSX.Element {
  return (
    <div className={cn('border-l-2 rounded-r-lg', className)} {...props}>
      {children}
    </div>
  );
}
