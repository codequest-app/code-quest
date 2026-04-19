import type { Message } from '../../types/ui';
import { messagePreview } from '../../utils/isMessageVisible';
import { highlight, typeColor, typeLabel } from '../../utils/message-preview';

const DEFAULT_RECENT_COUNT = 8;
const DEFAULT_SEARCH_LIMIT = 50;

const BADGE: React.CSSProperties = {
  fontSize: '9px',
  fontFamily: 'monospace',
  fontWeight: 700,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  borderRadius: '3px',
  padding: '2px 5px',
  flexShrink: 0,
  marginTop: '1px',
  whiteSpace: 'nowrap',
  minWidth: '90px',
  textAlign: 'center',
};

const SECTION_HEADER: React.CSSProperties = {
  padding: '6px 16px 2px',
  fontSize: '9px',
  fontFamily: 'monospace',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: '#4a4a4e',
};

export interface PaletteMessageListProps {
  messages: Message[];
  query: string;
  activeIdx: number;
  onActiveChange: (idx: number) => void;
  onJumpTo: (id: string) => void;
  onClose: () => void;
  showHeader?: boolean;
  recentCount?: number;
  searchLimit?: number;
  listRef?: React.RefObject<HTMLDivElement | null>;
}

export function PaletteMessageList({
  messages,
  query,
  activeIdx,
  onActiveChange,
  onJumpTo,
  onClose,
  showHeader = false,
  recentCount = DEFAULT_RECENT_COUNT,
  searchLimit = DEFAULT_SEARCH_LIMIT,
  listRef,
}: PaletteMessageListProps) {
  const q = query.trim().toLowerCase();
  const results = q
    ? messages.filter((m) => messagePreview(m).toLowerCase().includes(q)).slice(0, searchLimit)
    : messages.slice(-recentCount);
  if (results.length === 0) return null;

  return (
    <>
      {showHeader && <div style={SECTION_HEADER}>Messages</div>}
      <div ref={listRef}>
        {results.map((msg, idx) => {
          const isActive = idx === activeIdx;
          const color = typeColor(msg.type);
          const label = typeLabel(msg.type);
          const preview = messagePreview(msg).slice(0, 200);
          const previewParts = highlight(preview, query);
          return (
            <button
              key={msg.id}
              type="button"
              data-active={isActive || undefined}
              onClick={() => {
                onJumpTo(msg.id);
                onClose();
              }}
              onMouseEnter={() => onActiveChange(idx)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                width: '100%',
                padding: '10px 16px',
                background: isActive ? 'rgba(217,119,87,0.07)' : 'transparent',
                border: 'none',
                borderLeft: `2px solid ${isActive ? '#d97757' : 'transparent'}`,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.1s',
              }}
            >
              <span
                style={{
                  ...BADGE,
                  color,
                  background: `${color}18`,
                  border: `1px solid ${color}40`,
                }}
              >
                {label}
              </span>
              <span
                style={{
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  color: '#9d9d9d',
                  lineHeight: '1.5',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {previewParts.map((part, i) => {
                  const key = part.match ? 'match' : i === 0 ? 'pre' : 'post';
                  return part.match ? (
                    <mark
                      key={key}
                      style={{
                        background: 'rgba(217,119,87,0.3)',
                        color: '#d97757',
                        borderRadius: '2px',
                        padding: '0 1px',
                      }}
                    >
                      {part.text}
                    </mark>
                  ) : (
                    <span key={key}>{part.text}</span>
                  );
                })}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
