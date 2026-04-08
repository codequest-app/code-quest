import { useRecentCwds } from '../hooks/useRecentCwds';
import { DirectoryTree } from './DirectoryTree';

export function FileExplorerPanel({ onSelectCwd }: { onSelectCwd?: (path: string) => void }) {
  const { recents, addRecent } = useRecentCwds();

  function handleSelect(path: string) {
    addRecent(path);
    onSelectCwd?.(path);
  }

  return (
    <div className="flex flex-col h-full overflow-auto thin-scrollbar">
      <div className="px-2 py-1 text-xs font-semibold uppercase text-muted">Explorer</div>
      <DirectoryTree onSelect={handleSelect} />

      {recents.length > 0 && (
        <div className="mt-2 border-t border-border">
          <div className="px-2 py-1 text-xs font-semibold uppercase text-muted">Recents</div>
          {recents.map((r) => (
            // biome-ignore lint/a11y/noStaticElementInteractions: list item with double-click
            <div
              key={r.path}
              className="px-3 py-1 text-sm cursor-pointer hover:bg-accent/20 truncate"
              title={r.path}
              onDoubleClick={() => handleSelect(r.path)}
            >
              📁 {r.path.split('/').pop()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
