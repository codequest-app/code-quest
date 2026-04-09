export function EmptyState({
  onAddProject,
  onNewTab,
}: {
  onAddProject?: () => void;
  onNewTab?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-4 text-text-muted">
      <span className="text-4xl">📁</span>
      <p>No projects yet</p>
      {onNewTab && (
        <button
          type="button"
          className="px-6 py-2 rounded bg-accent text-white text-sm hover:bg-accent/80"
          onClick={onNewTab}
          data-testid="empty-new-session"
        >
          ＋ New Session
        </button>
      )}
      {onAddProject && (
        <button
          type="button"
          className="px-6 py-2 rounded bg-surface-hover text-text text-sm hover:bg-surface-active"
          onClick={onAddProject}
        >
          ＋ Add Project
        </button>
      )}
    </div>
  );
}
