import type { ComponentPropsWithoutRef, ElementType } from 'react';
import { cn } from '@/utils/cn';

type SurfaceCardProps<C extends ElementType = 'div'> = {
  as?: C;
  className?: string;
  children?: React.ReactNode;
} & Omit<ComponentPropsWithoutRef<C>, 'as' | 'className' | 'children'>;

export function SurfaceCard<C extends ElementType = 'div'>({
  as: As = 'div' as C,
  className,
  children,
  ...rest
}: SurfaceCardProps<C>): React.JSX.Element {
  const props = {
    ...(rest as ComponentPropsWithoutRef<C>),
    className: cn('bg-surface border border-border rounded p-3', className),
    children,
  };
  // biome-ignore lint/suspicious/noExplicitAny: polymorphic component requires any for JSX spread
  return <As {...(props as any)} />;
}
