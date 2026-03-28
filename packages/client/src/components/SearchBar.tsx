import type { Ref } from 'react';
import { useState } from 'react';
import type { Message } from '../types/ui';

// Derived from Message['type'] — stays in sync with type definition
const MESSAGE_TYPES: Message['type'][] = [
  'text',
  'thinking',
  'tool_use',
  'tool_result',
  'result',
  'error',
  'pending_action',
  'action_result',
  'task_started',
  'compact_boundary',
  'streamlined_text',
  'streamlined_tool_use_summary',
  'rate_limit_event',
  'hook_started',
  'hook_response',
  'hook_diagnostics',
  'unknown_delta',
  'raw_event',
  'unhandled',
  'content_block_start',
];

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  typeFilter?: string[];
  setTypeFilter?: (types: string[]) => void;
  inputRef?: Ref<HTMLInputElement>;
}

export function SearchBar({
  searchQuery,
  setSearchQuery,
  typeFilter = [],
  setTypeFilter,
  inputRef,
}: SearchBarProps) {
  const [showFilter, setShowFilter] = useState(false);

  const toggleType = (type: string) => {
    if (!setTypeFilter) return;
    setTypeFilter(
      typeFilter.includes(type) ? typeFilter.filter((t) => t !== type) : [...typeFilter, type],
    );
  };

  return (
    <div className="border-b border-border">
      <div className="flex items-center gap-2 px-4 py-2">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search messages..."
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
        {setTypeFilter && (
          <button
            type="button"
            aria-label="Toggle type filter"
            onClick={() => setShowFilter((v) => !v)}
            className={`text-xs cursor-pointer transition-colors ${
              typeFilter.length > 0 ? 'text-accent' : 'text-text-muted hover:text-text'
            }`}
          >
            ⚙ {typeFilter.length > 0 && `(${typeFilter.length})`}
          </button>
        )}
      </div>
      {showFilter && setTypeFilter && (
        <div
          className="px-4 py-2 border-t border-border flex flex-wrap gap-2"
          data-testid="type-filter-dropdown"
        >
          {MESSAGE_TYPES.map((type) => (
            <label
              key={type}
              className="flex items-center gap-1 text-[11px] text-text-muted cursor-pointer"
            >
              <input
                type="checkbox"
                checked={typeFilter.includes(type)}
                onChange={() => toggleType(type)}
                className="w-3 h-3"
              />
              {type}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
