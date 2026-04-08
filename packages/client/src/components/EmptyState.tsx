export function EmptyState({ onAddProject }: { onAddProject: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-4 text-text-muted">
      <span className="text-4xl">📁</span>
      <p>No projects yet</p>
      <button
        type="button"
        className="px-6 py-2 rounded bg-accent text-white text-sm hover:bg-accent/80"
        onClick={onAddProject}
      >
        ＋ Add Project
      </button>
    </div>
  );
}
