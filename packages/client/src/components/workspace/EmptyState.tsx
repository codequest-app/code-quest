import type { ReactNode } from 'react';
import { Button } from '../ui/Button.tsx';

interface EmptyStateProps {
  /** Optional 32-40px glyph anchored above the message — gives the empty
   *  state a visual anchor instead of just floating text. */
  icon?: ReactNode;
  message: string;
  /** Optional secondary content below the message — code snippet, CTA link,
   *  install instructions etc. */
  hint?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  message,
  hint,
  actionLabel,
  onAction,
}: EmptyStateProps): React.JSX.Element {
  const hasAction = actionLabel !== undefined && onAction !== undefined;
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-4 text-text-muted text-center px-6">
      {icon && <span className="text-text-muted/60">{icon}</span>}
      <p className="max-w-xs text-sm">{message}</p>
      {hint && <div className="text-xs text-text-dim">{hint}</div>}
      {hasAction && (
        <Button variant="primary" size="md" className="px-6 py-2" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
