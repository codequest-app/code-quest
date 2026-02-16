interface WorktreeIndicatorProps {
  path: string;
  branch: string;
}

export function WorktreeIndicator({ path, branch }: WorktreeIndicatorProps) {
  if (!path) return null;

  return (
    <div className="worktree-indicator" data-testid="worktree-indicator">
      <span className="worktree-icon">🌳</span>
      <span className="worktree-branch">{branch}</span>
      <span className="worktree-path">{path}</span>

      <style>{`
        .worktree-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 8px;
          background: rgba(128, 0, 255, 0.15);
          border: 1px solid rgba(128, 0, 255, 0.4);
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          color: #ce93d8;
        }

        .worktree-icon {
          font-size: 14px;
        }

        .worktree-branch {
          font-weight: bold;
        }

        .worktree-path {
          color: #999;
          font-size: 11px;
        }
      `}</style>
    </div>
  );
}
