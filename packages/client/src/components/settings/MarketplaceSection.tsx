import type { MarketplaceInfo } from '@code-quest/shared';
import { Button } from '../ui/Button.tsx';
import { ActionButton, RefreshIcon, TrashIcon } from '../ui/Icons.tsx';

export interface MarketplaceSectionProps {
  marketplaces: MarketplaceInfo[];
  newSource: string;
  onNewSourceChange: (source: string) => void;
  onAdd: () => void;
  onRemove: (marketplaceId: string) => void;
  onRefresh: () => void;
  adding: boolean;
}

export function MarketplaceSection({
  marketplaces,
  newSource,
  onNewSourceChange,
  onAdd,
  onRemove,
  onRefresh,
  adding,
}: MarketplaceSectionProps): React.JSX.Element {
  return (
    <>
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={newSource}
          onChange={(e) => onNewSourceChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onAdd()}
          placeholder="Marketplace source URL…"
          className="flex-1 border border-border bg-input text-text placeholder:text-text-muted rounded-md px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <Button
          variant="info"
          size="md"
          disabled={!newSource.trim() || adding}
          className="rounded-md py-2"
          onClick={onAdd}
        >
          Add
        </Button>
      </div>

      {marketplaces.length === 0 ? (
        <p className="text-center text-text-muted/60 py-8 text-sm">No marketplaces configured.</p>
      ) : (
        <ul className="list-none m-0 p-0">
          {marketplaces.map((mp) => {
            const src = mp.config?.source;
            const detail = !src
              ? undefined
              : src.source === 'npm'
                ? src.package
                : src.source === 'github'
                  ? src.repo
                  : src.source === 'git' || src.source === 'url'
                    ? src.url
                    : 'path' in src
                      ? src.path
                      : undefined;
            return (
              <li
                key={mp.name}
                className="flex items-start justify-between bg-surface border border-border rounded-md mb-2 p-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-text font-medium text-sm">{mp.name}</span>
                    <span className="text-xs text-text-muted">{src.source}</span>
                  </div>
                  {detail && <p className="text-text-muted text-xs m-0 truncate">{detail}</p>}
                  <p className="text-text-muted text-xs mt-1 m-0">
                    {mp.installedCount} / {mp.pluginCount} installed
                  </p>
                </div>
                <div className="flex items-center gap-1.5 ml-3 shrink-0">
                  <ActionButton onClick={onRefresh} label="Refresh marketplace">
                    <RefreshIcon className="w-3.5 h-3.5" />
                  </ActionButton>
                  <ActionButton onClick={() => onRemove(mp.name)} label="Remove marketplace" danger>
                    <TrashIcon className="w-3.5 h-3.5" />
                  </ActionButton>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
