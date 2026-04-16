import type { FilterEntry } from './FilterPopover';

interface RawEventFilterBarProps {
  entries: FilterEntry[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}

export function RawEventFilterBar({ entries, selected, onChange }: RawEventFilterBarProps) {
  const sorted = [...entries].sort((a, b) => b.count - a.count);
  const maxCount = sorted[0]?.count ?? 1;

  const toggle = (type: string) => {
    const next = new Set(selected);
    if (next.has(type)) next.delete(type);
    else next.add(type);
    onChange(next);
  };

  if (sorted.length === 0) return null;

  return (
    <div
      style={{
        borderBottom: '1px solid #2a2c30',
        padding: '6px 0 6px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        flexShrink: 0,
      }}
    >
      {/* header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingRight: '12px',
        }}
      >
        <span
          style={{
            fontSize: '8px',
            fontFamily: 'monospace',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#3e3e42',
          }}
        >
          channels
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => onChange(new Set(sorted.map((e) => e.type)))}
            style={{
              fontSize: '8px',
              fontFamily: 'monospace',
              color: '#3a3a3e',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              letterSpacing: '0.06em',
              transition: 'color 0.1s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#d97757';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#3a3a3e';
            }}
          >
            all
          </button>
          <button
            type="button"
            onClick={() => onChange(new Set())}
            style={{
              fontSize: '8px',
              fontFamily: 'monospace',
              color: '#3a3a3e',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              letterSpacing: '0.06em',
              transition: 'color 0.1s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#cccccc';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#3a3a3e';
            }}
          >
            none
          </button>
        </div>
      </div>

      {/* chips row — horizontal scroll */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          overflowX: 'auto',
          paddingRight: '12px',
          paddingBottom: '2px',
          scrollbarWidth: 'none',
        }}
      >
        {sorted.map((entry) => {
          const active = selected.has(entry.type);
          const barRatio = entry.count / maxCount;

          return (
            <button
              key={entry.type}
              type="button"
              aria-label={entry.type}
              aria-pressed={active}
              onClick={() => toggle(entry.type)}
              title={`${entry.type} (${entry.count})`}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 6px',
                borderRadius: '3px',
                border: active
                  ? '1px solid rgba(217,119,87,0.5)'
                  : '1px solid rgba(255,255,255,0.06)',
                background: active ? 'rgba(217,119,87,0.08)' : 'rgba(255,255,255,0.02)',
                cursor: 'pointer',
                flexShrink: 0,
                overflow: 'hidden',
                transition: 'border-color 0.15s, background 0.15s',
              }}
            >
              {/* bar fill behind text */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  bottom: 0,
                  top: 0,
                  width: `${Math.max(barRatio * 100, 8)}%`,
                  background: active ? 'rgba(217,119,87,0.06)' : 'rgba(255,255,255,0.015)',
                  transition: 'width 0.3s',
                  pointerEvents: 'none',
                }}
              />
              <span
                style={{
                  fontSize: '9px',
                  fontFamily: 'monospace',
                  color: active ? '#d97757' : '#4a4a4e',
                  transition: 'color 0.15s',
                  position: 'relative',
                  whiteSpace: 'nowrap',
                  maxWidth: '72px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {entry.type}
              </span>
              <span
                style={{
                  fontSize: '8px',
                  fontFamily: 'monospace',
                  color: active ? 'rgba(217,119,87,0.6)' : 'rgba(255,255,255,0.12)',
                  position: 'relative',
                  transition: 'color 0.15s',
                }}
              >
                {entry.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
