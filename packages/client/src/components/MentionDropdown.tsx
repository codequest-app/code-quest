import type { FileSearchResult } from '@code-quest/shared';

function getFileTypeLabel(type: string): string {
  switch (type) {
    case 'directory':
      return '/';
    case 'terminal':
      return 'term';
    case 'browser':
      return 'www';
    default:
      return '';
  }
}

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

function DropdownItem({ label, onSelect }: { label: string; onSelect: () => void }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onSelect();
      }}
      className="w-full text-left px-3 py-1.5 text-xs text-text hover:bg-white/10 font-mono"
    >
      {label}
    </button>
  );
}

function FileResultItem({
  file,
  index,
  selectedIndex,
  mentionQuery,
  onSelect,
}: {
  file: FileSearchResult;
  index: number;
  selectedIndex: number;
  mentionQuery: string;
  onSelect: (path: string) => void;
}) {
  return (
    <div
      onMouseDown={(e) => {
        e.preventDefault();
        onSelect(`@${file.path}`);
      }}
      role="option"
      aria-selected={index === selectedIndex}
      tabIndex={-1}
      className={`flex items-center gap-1.5 px-3 py-1.5 cursor-pointer hover:bg-white/5 rounded ${index === selectedIndex ? 'bg-white/5' : ''}`}
    >
      <span className="w-5 h-5 flex items-center justify-center text-[10px] text-text-muted opacity-60 flex-shrink-0 font-mono">
        {getFileTypeLabel(file.type)}
      </span>
      <span className="text-xs font-mono text-text truncate">
        <HighlightMatch text={file.path} query={mentionQuery} />
      </span>
    </div>
  );
}

export interface MentionDropdownProps {
  mentionQuery: string;
  filteredSuggestions: string[];
  fileResults: FileSearchResult[];
  searchStatus: 'idle' | 'loading' | 'done';
  selectedIndex: number;
  hasFileSearch: boolean;
  onSelectMention: (suggestion: string) => void;
}

export function MentionDropdown({
  mentionQuery,
  filteredSuggestions,
  fileResults,
  searchStatus,
  selectedIndex,
  hasFileSearch,
  onSelectMention,
}: MentionDropdownProps) {
  return (
    <div
      data-testid="mention-dropdown"
      className="absolute bottom-full left-0 right-0 mb-2 bg-surface border border-border rounded-lg shadow-lg overflow-hidden animate-fade-in-fast z-50"
    >
      <div className="max-h-[300px] overflow-y-auto scrollbar-thin py-0.5">
        {hasFileSearch && searchStatus === 'loading' && (
          <div className="px-3 py-2 text-xs text-text-muted text-center">Searching…</div>
        )}
        {hasFileSearch && searchStatus === 'done' && fileResults.length === 0 && (
          <div className="px-3 py-2 text-xs text-text-muted text-center">No files found</div>
        )}
        {!hasFileSearch &&
          filteredSuggestions.length > 0 &&
          filteredSuggestions.map((s) => (
            <DropdownItem key={s} label={s} onSelect={() => onSelectMention(s)} />
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
            />
          ))}
      </div>
    </div>
  );
}
