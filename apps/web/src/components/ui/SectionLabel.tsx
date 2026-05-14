import type { ComponentPropsWithoutRef, ElementType } from 'react';
import { cn } from '@/utils/cn';

type SectionLabelProps<C extends ElementType = 'div'> = {
  as?: C;
  className?: string;
  children?: React.ReactNode;
} & Omit<ComponentPropsWithoutRef<C>, 'as' | 'className' | 'children'>;

export function SectionLabel<C extends ElementType = 'div'>({
  as: As = 'div' as C,
  className,
  children,
  ...rest
}: SectionLabelProps<C>): React.JSX.Element {
  return (
    // biome-ignore lint/suspicious/noExplicitAny: polymorphic spread requires any cast
    <As {...(rest as any)} className={cn('section-label', className)}>
      {children}
    </As>
  );
}
