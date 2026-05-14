import type { ComponentPropsWithoutRef, ElementType } from 'react';
import { cn } from '@/utils/cn';

export const menuItemClass: string =
  'w-full text-left px-3 py-1.5 text-sm text-text hover:bg-hover-tint data-[highlighted]:bg-hover-tint outline-none cursor-pointer';

export const dangerMenuItemClass: string =
  'w-full text-left px-3 py-1.5 text-sm text-danger hover:bg-danger/10 data-[highlighted]:bg-danger/10 outline-none cursor-pointer';

type MenuItemProps<C extends ElementType = 'button'> = {
  as?: C;
  danger?: boolean;
  className?: string;
  children?: React.ReactNode;
} & Omit<ComponentPropsWithoutRef<C>, 'as' | 'className' | 'children'>;

export function MenuItem<C extends ElementType = 'button'>({
  as: As = 'button' as C,
  danger = false,
  className,
  children,
  ...rest
}: MenuItemProps<C>): React.JSX.Element {
  const props = {
    type: As === 'button' ? 'button' : undefined,
    ...(rest as ComponentPropsWithoutRef<C>),
    className: cn(danger ? dangerMenuItemClass : menuItemClass, className),
  };
  // biome-ignore lint/suspicious/noExplicitAny: polymorphic component requires any for JSX spread
  return <As {...(props as any)}>{children}</As>;
}
