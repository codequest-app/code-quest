interface EmptyStateProps {
  icon?: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
  testId?: string;
}

export function EmptyState({ icon, message, actionLabel, onAction, testId }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-4 text-text-muted">
      {icon && <span className="text-4xl">{icon}</span>}
      <p>{message}</p>
      <button
        type="button"
        className="px-6 py-2 rounded bg-accent text-white text-sm hover:bg-accent/80"
        onClick={onAction}
        data-testid={testId}
      >
        {actionLabel}
      </button>
    </div>
  );
}
