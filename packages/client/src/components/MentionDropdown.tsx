import type { FsSearchResult } from '@code-quest/shared';
import { cn } from '../utils/cn';
import { FileIcon, FolderIcon } from './icons/MentionIcons';

const noop = () => {};

function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span className="text-accent font-semibold">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}

function TypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'directory':
      return <FolderIcon className="w-5 h-5" />;
    default:
      return <FileIcon className="w-5 h-5" />;
  }
}

function FileResultItem({
  file,
  index,
  selectedIndex,
  mentionQuery,
  onSelect,
  onHover,
  itemRef,
}: {
  file: FsSearchResult;
  index: number;
  selectedIndex: number;
  mentionQuery: string;
  onSelect: (path: string, navigateInto: boolean) => void;
  onHover: (index: number) => void;
  itemRef: React.Ref<HTMLDivElement> | null;
}) {
  const isActive = index === selectedIndex;
  const directoryPath =
    file.type === 'file' && file.path.length > file.name.length
      ? file.path.substring(0, file.path.length - file.name.length)
      : null;

  return (
    <div
      ref={itemRef}
      onMouseDown={(e) => {
        e.preventDefault();
        onSelect(`@${file.path}`, file.type === 'directory');
      }}
      onMouseEnter={() => onHover(index)}
      role="option"
      aria-selected={isActive}
      tabIndex={-1}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 cursor-pointer rounded',
        isActive ? 'bg-selected text-selected-text' : 'hover:tint-5',
      )}
    >
      <div className="w-5 h-5 flex items-center justify-center text-text-muted opacity-60 shrink-0">
        <TypeIcon type={file.type} />
      </div>
      {file.type === 'file' ? (
        <>
          <span className="text-xs font-mono text-text truncate">
            <HighlightMatch text={file.name} query={mentionQuery} />
          </span>
          {directoryPath && (
            <span className="text-xs font-mono text-text-muted truncate">{directoryPath}</span>
          )}
        </>
      ) : (
        <span className="text-xs font-mono text-text truncate">
          <HighlightMatch text={file.path} query={mentionQuery} />
        </span>
      )}
    </div>
  );
}

function DropdownItem({ label, onSelect }: { label: string; onSelect: () => void }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onSelect();
      }}
      className="w-full text-left px-3 py-1.5 text-xs text-text hover:tint-10 font-mono"
    >
      {label}
    </button>
  );
}

export interface MentionDropdownProps {
  mentionQuery: string;
  filteredSuggestions: string[];
  fileResults: FsSearchResult[];
  searchStatus: 'idle' | 'loading' | 'done';
  selectedIndex: number;
  hasFileSearch: boolean;
  onSelectMention: (suggestion: string, navigateInto: boolean) => void;
  onHover?: (index: number) => void;
  activeItemRef?: React.Ref<HTMLDivElement>;
}

export function MentionDropdown({
  mentionQuery,
  filteredSuggestions,
  fileResults,
  searchStatus,
  selectedIndex,
  hasFileSearch,
  onSelectMention,
  onHover,
  activeItemRef,
}: MentionDropdownProps) {
  return (
    <div
      data-testid="mention-dropdown"
      className="absolute bottom-full left-0 right-0 mb-2 bg-surface border border-border rounded-lg shadow-floating overflow-hidden animate-fade-in-fast z-modal"
    >
      <div className="max-h-75 overflow-y-auto py-0.5">
        {hasFileSearch && searchStatus === 'loading' && (
          <div className="px-3 py-2 text-xs text-text-muted text-center">Searching…</div>
        )}
        {hasFileSearch && searchStatus === 'done' && fileResults.length === 0 && (
          <div className="px-3 py-2 text-xs text-text-muted text-center">No files found</div>
        )}
        {!hasFileSearch &&
          filteredSuggestions.length > 0 &&
          filteredSuggestions.map((s) => (
            <DropdownItem key={s} label={s} onSelect={() => onSelectMention(s, false)} />
          ))}
        {hasFileSearch &&
          fileResults.length > 0 &&
          fileResults.map((f, i) => (
            <FileResultItem
              key={f.path}
              file={f}
              index={i}
              selectedIndex={selectedIndex}
              mentionQuery={mentionQuery}
              onSelect={onSelectMention}
              onHover={onHover ?? noop}
              itemRef={i === selectedIndex ? (activeItemRef ?? null) : null}
            />
          ))}
      </div>
    </div>
  );
}
