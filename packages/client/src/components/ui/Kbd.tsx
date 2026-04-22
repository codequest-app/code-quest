import type { ReactNode } from 'react';

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="px-1 py-0.5 bg-surface-hover rounded text-xs">{children}</kbd>;
}
