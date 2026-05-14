import type { ComponentPropsWithoutRef, ComponentPropsWithRef, ElementType } from 'react';
import { cn } from '@/utils/cn';

type FloatingCardProps<C extends ElementType = 'div'> = {
  as?: C;
  className?: string;
  children?: React.ReactNode;
  ref?: ComponentPropsWithRef<C>['ref'];
} & Omit<ComponentPropsWithoutRef<C>, 'as' | 'className' | 'children' | 'ref'>;

export function FloatingCard<C extends ElementType = 'div'>({
  as: As = 'div' as C,
  className,
  children,
  ref,
  ...rest
}: FloatingCardProps<C>): React.JSX.Element {
  const Tag = As as React.ElementType;
  return (
    <Tag
      {...(rest as ComponentPropsWithoutRef<C>)}
      ref={ref}
      className={cn('bg-surface border border-border rounded-lg shadow-floating p-3', className)}
    >
      {children}
    </Tag>
  );
}
