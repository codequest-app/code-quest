import type { Ref } from 'react';
import { cn } from '../utils/cn';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  inputRef?: Ref<HTMLInputElement>;
  onToggleRaw?: () => void;
  rawActive?: boolean;
  placeholder?: string;
}

export function SearchBar({
  searchQuery,
  setSearchQuery,
  inputRef,
  onToggleRaw,
  rawActive = false,
  placeholder = 'Search messages...',
}: SearchBarProps) {
  return (
    <div className="border-b border-border">
      <div className="flex items-center gap-2 px-4 py-2">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-text placeholder:text-text-muted focus:outline-none"
        />
        {searchQuery && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setSearchQuery('')}
            className="text-xs text-text-muted hover:text-text cursor-pointer"
          >
            ✕
          </button>
        )}
        {onToggleRaw && (
          <button
            type="button"
            aria-label="Toggle Raw Events"
            data-active={String(rawActive)}
            onClick={onToggleRaw}
            className={cn(
              'cursor-pointer transition-colors text-xs font-medium px-1.5 py-0.5 rounded',
              rawActive ? 'text-accent bg-accent/10' : 'text-text-muted hover:text-text',
            )}
          >
            Raw
          </button>
        )}
      </div>
    </div>
  );
}
