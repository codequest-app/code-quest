import { useState } from 'react';

export interface FilterEntry {
  type: string;
  count: number;
}

interface FilterPopoverProps {
  entries: FilterEntry[];
  selected: Set<string>;
  onChange: (selected: Set<string>) => void;
  labels?: Partial<Record<string, string>>;
}

export function FilterPopover({ entries, selected, onChange, labels = {} }: FilterPopoverProps) {
  const [search, setSearch] = useState('');

  const sorted = [...entries].sort((a, b) => b.count - a.count);
  const q = search.toLowerCase();
  const visible = q ? sorted.filter((e) => e.type.toLowerCase().includes(q)) : sorted;

  const toggle = (type: string) => {
    const next = new Set(selected);
    if (next.has(type)) {
      next.delete(type);
    } else {
      next.add(type);
    }
    onChange(next);
  };

  const selectAll = () => {
    const next = new Set(selected);
    for (const e of visible) next.add(e.type);
    onChange(next);
  };

  // Clear all removes every entry (not just visible ones) to avoid confusing partial clears
  const clearAll = () => {
    const next = new Set(selected);
    for (const e of sorted) next.delete(e.type);
    onChange(next);
  };

  const maxCount = sorted[0]?.count ?? 1;

  return (
    <div
      style={{
        background: 'linear-gradient(160deg, #1e2025 0%, #1a1c20 100%)',
        border: '1px solid #3e3e42',
        borderRadius: '10px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(217,119,87,0.08) inset',
        minWidth: '200px',
        maxHeight: '320px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '8px 10px 6px',
          borderBottom: '1px solid rgba(62,62,66,0.6)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <svg
          width="11"
          height="11"
          viewBox="0 0 11 11"
          fill="none"
          aria-hidden="true"
          style={{ flexShrink: 0, color: '#5a5a5e' }}
        >
          <circle cx="4.5" cy="4.5" r="3.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M7.5 7.5L10 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter types..."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: '11px',
            color: '#cccccc',
            fontFamily: 'monospace',
          }}
        />
        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
          <button
            type="button"
            aria-label="Select all"
            onClick={selectAll}
            style={{
              fontSize: '9px',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: '#d97757',
              background: 'rgba(217,119,87,0.1)',
              border: '1px solid rgba(217,119,87,0.25)',
              borderRadius: '4px',
              padding: '2px 6px',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(217,119,87,0.2)';
              e.currentTarget.style.borderColor = 'rgba(217,119,87,0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(217,119,87,0.1)';
              e.currentTarget.style.borderColor = 'rgba(217,119,87,0.25)';
            }}
          >
            All
          </button>
          <button
            type="button"
            aria-label="Clear all"
            onClick={clearAll}
            style={{
              fontSize: '9px',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: '#9d9d9d',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '4px',
              padding: '2px 6px',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.color = '#cccccc';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              e.currentTarget.style.color = '#9d9d9d';
            }}
          >
            None
          </button>
        </div>
      </div>

      <div style={{ overflowY: 'auto', flex: 1, padding: '4px 0' }}>
        {visible.map((e) => {
          const labelText = labels[e.type] ?? e.type;
          const checked = selected.has(e.type);
          const barWidth = Math.round((e.count / maxCount) * 100);
          const id = `fp-${e.type}`;

          return (
            <label
              key={e.type}
              htmlFor={id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 12px',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.1s',
              }}
              onMouseEnter={(el) => {
                el.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              }}
              onMouseLeave={(el) => {
                el.currentTarget.style.background = 'transparent';
              }}
            >
              {/* count bar background */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${barWidth}%`,
                  background: checked ? 'rgba(217,119,87,0.06)' : 'rgba(255,255,255,0.02)',
                  pointerEvents: 'none',
                  transition: 'width 0.2s, background 0.15s',
                }}
              />

              {/* hidden real checkbox for a11y + tests */}
              <input
                id={id}
                type="checkbox"
                checked={checked}
                onChange={() => toggle(e.type)}
                style={{
                  position: 'absolute',
                  opacity: 0,
                  width: '1px',
                  height: '1px',
                  pointerEvents: 'auto',
                }}
              />

              <div
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  flexShrink: 0,
                  background: checked ? '#d97757' : 'rgba(255,255,255,0.12)',
                  transition: 'background 0.15s',
                  zIndex: 1,
                }}
              />

              <span
                style={{
                  flex: 1,
                  fontSize: '11px',
                  color: checked ? '#cccccc' : '#5a5a5e',
                  fontFamily: 'monospace',
                  transition: 'color 0.15s',
                  zIndex: 1,
                }}
              >
                {labelText}
              </span>

              <span
                style={{
                  fontSize: '10px',
                  color: checked ? 'rgba(217,119,87,0.7)' : 'rgba(255,255,255,0.15)',
                  fontVariantNumeric: 'tabular-nums',
                  fontFamily: 'monospace',
                  zIndex: 1,
                  transition: 'color 0.15s',
                }}
              >
                {e.count}
              </span>
            </label>
          );
        })}
        {visible.length === 0 && (
          <div
            style={{
              padding: '12px',
              textAlign: 'center',
              fontSize: '11px',
              color: '#4a4a4e',
              fontStyle: 'italic',
            }}
          >
            No matches
          </div>
        )}
      </div>
    </div>
  );
}
