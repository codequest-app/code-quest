import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  testId?: string;
}

export function EmptyState({ icon, message, actionLabel, onAction, testId }: EmptyStateProps) {
  const hasAction = actionLabel !== undefined && onAction !== undefined;
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-4 text-text-muted">
      {icon && <span className="text-text-muted/60">{icon}</span>}
      <p>{message}</p>
      {hasAction && (
        <button
          type="button"
          className="px-6 py-2 rounded bg-accent text-white text-sm hover:bg-accent/80"
          onClick={onAction}
          data-testid={testId}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
