import type { ReactNode } from 'react';
import { cn } from '../utils/cn';

export interface DrawerAsideProps {
  side: 'left' | 'right';
  open: boolean;
  /** Tailwind class for mobile slide-in drawer width, e.g. `'w-[min(85vw,320px)]'`. */
  mobileWidthClass: string;
  /** Tailwind class for docked-mode (lg+) column width, e.g. `'lg:w-65'`. */
  dockedWidthClass: string;
  label: string;
  children: ReactNode;
}

/** Slide-in drawer (<lg) that becomes a docked column at lg+. Side-symmetric:
 *  `side` controls anchor position, border, and closed-state translate direction.
 *  Width axes are explicit so the two layout panes can carry different widths. */
export function DrawerAside({
  side,
  open,
  mobileWidthClass,
  dockedWidthClass,
  label,
  children,
}: DrawerAsideProps) {
  const isLeft = side === 'left';
  return (
    <aside
      aria-label={label}
      data-open={open || undefined}
      className={cn(
        'fixed inset-y-0 z-modal bg-surface',
        isLeft ? 'left-0 border-r border-border' : 'right-0 border-l border-border',
        mobileWidthClass,
        'transition-transform duration-150 ease-out',
        !open && (isLeft ? '-translate-x-full' : 'translate-x-full'),
        'lg:static lg:translate-x-0 lg:shrink-0',
        dockedWidthClass,
        !open && 'lg:w-0 lg:overflow-hidden',
      )}
    >
      <div className="h-full overflow-auto">{children}</div>
    </aside>
  );
}
