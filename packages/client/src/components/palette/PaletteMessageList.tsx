import type { Message } from '../../types/ui';
import { messagePreview } from '../../utils/isMessageVisible';
import { highlight, typeColor, typeLabel } from '../../utils/message-preview';
import { SectionHeader } from '../ui/SectionHeader';
import {
  PALETTE_RECENT_COUNT,
  PALETTE_SEARCH_LIMIT,
  paletteMessageResults,
} from './palette-message-results';

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
  recentCount = PALETTE_RECENT_COUNT,
  searchLimit = PALETTE_SEARCH_LIMIT,
  listRef,
}: PaletteMessageListProps) {
  const results = paletteMessageResults(messages, query, { recentCount, searchLimit });
  if (results.length === 0) return null;

  return (
    <>
      {showHeader && <SectionHeader>Messages</SectionHeader>}
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
                background: isActive ? 'var(--color-row-active-bg)' : 'transparent',
                border: 'none',
                borderLeft: `2px solid ${isActive ? 'var(--color-accent)' : 'transparent'}`,
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
                  color: 'var(--color-text-muted)',
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
                        background: 'var(--color-accent-mark-bg)',
                        color: 'var(--color-accent)',
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
