import { useEffect, useRef, useState } from 'react';
import { useChannelMessages, useMessageVisibility } from '../contexts/channel';
import type { Message } from '../types/ui';
import { isMessageVisible, messagePreview } from '../utils/isMessageVisible';
import { MESSAGE_TYPE_LABELS } from '../utils/message-type-labels';
import { ActionsTab, FiltersSection, PanelsSection, SECTION_LABEL } from './ActionsTab';

type Tab = 'all' | 'messages' | 'actions';

const TYPE_COLORS: Partial<Record<string, string>> = {
  text: '#81b88b',
  thinking: '#9d7fd4',
  redacted_thinking: '#9d7fd4',
  tool_use: '#d97757',
  tool_result: '#c6913f',
  error: '#f48771',
  result: '#e1c08d',
  hook_started: '#5a9fd4',
  hook_response: '#5a9fd4',
  hook_diagnostics: '#5a9fd4',
};

function typeColor(type: string): string {
  return TYPE_COLORS[type] ?? '#6a6a6e';
}

function typeLabel(type: string): string {
  return MESSAGE_TYPE_LABELS[type as Message['type']] ?? type;
}

function highlight(text: string, query: string): Array<{ text: string; match: boolean }> {
  if (!query) return [{ text, match: false }];
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return [{ text, match: false }];
  return [
    { text: text.slice(0, idx), match: false },
    { text: text.slice(idx, idx + query.length), match: true },
    { text: text.slice(idx + query.length), match: false },
  ];
}

const RECENT_COUNT = 8;

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

interface MessageResultListProps {
  results: Message[];
  activeIdx: number;
  query: string;
  showSection: boolean;
  listRef: React.RefObject<HTMLDivElement | null>;
  onJumpTo: (id: string) => void;
  onClose: () => void;
  setActiveIdx: (idx: number) => void;
}

function MessageResultList({
  results,
  activeIdx,
  query,
  showSection,
  listRef,
  onJumpTo,
  onClose,
  setActiveIdx,
}: MessageResultListProps) {
  if (results.length === 0) return null;
  return (
    <>
      {showSection && <div style={SECTION_LABEL}>Messages</div>}
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
              onMouseEnter={() => setActiveIdx(idx)}
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

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onJumpTo: (id: string) => void;
  onToggleRawPanel?: () => void;
  rawPanelActive?: boolean;
}

export function CommandPalette({
  open,
  onClose,
  onJumpTo,
  onToggleRawPanel,
  rawPanelActive = false,
}: CommandPaletteProps) {
  const { messages } = useChannelMessages();
  const { enabledTypes } = useMessageVisibility();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const visibleMessages = messages.filter(
    (m) => isMessageVisible(m, enabledTypes) && m.content.length > 0,
  );
  const q = query.trim().toLowerCase();

  const messageResults: Message[] = q
    ? visibleMessages.filter((m) => messagePreview(m).toLowerCase().includes(q)).slice(0, 50)
    : visibleMessages.slice(-RECENT_COUNT);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIdx(0);
      setActiveTab('all');
      const id = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
  }, [open]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset idx when query or tab changes
  useEffect(() => {
    setActiveIdx(0);
  }, [query, activeTab]);

  useEffect(() => {
    const el = listRef.current?.children[activeIdx] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, messageResults.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    }
    if (e.key === 'Enter' && messageResults[activeIdx]) {
      onJumpTo(messageResults[activeIdx].id);
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '10vh',
        background: 'rgba(10,10,12,0.75)',
        backdropFilter: 'blur(2px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div
        style={{
          width: '640px',
          maxWidth: 'calc(100vw - 48px)',
          background: 'linear-gradient(180deg, #1c1e22 0%, #181a1e 100%)',
          border: '1px solid #3e3e42',
          borderRadius: '8px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(217,119,87,0.12) inset',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '70vh',
        }}
      >
        <div
          role="tablist"
          style={{ display: 'flex', borderBottom: '1px solid #2a2c30', flexShrink: 0 }}
        >
          {(['all', 'messages', 'actions'] as Tab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 16px',
                fontSize: '11px',
                fontFamily: 'monospace',
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid #d97757' : '2px solid transparent',
                color: activeTab === tab ? '#d97757' : '#6a6a6e',
                cursor: 'pointer',
                transition: 'color 0.1s, border-color 0.1s',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: '12px',
            height: '52px',
            flexShrink: 0,
            borderBottom: '1px solid #2a2c30',
          }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 15 15"
            fill="none"
            aria-hidden="true"
            style={{ flexShrink: 0, color: '#d97757' }}
          >
            <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M10.5 10.5L14 14"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search messages or type a command…"
            aria-label="Search"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '14px',
              fontFamily: 'monospace',
              color: '#e8e8e8',
              letterSpacing: '0.01em',
            }}
          />
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {activeTab === 'all' && (
            <>
              <MessageResultList
                results={messageResults}
                activeIdx={activeIdx}
                query={query}
                showSection={true}
                listRef={listRef}
                onJumpTo={onJumpTo}
                onClose={onClose}
                setActiveIdx={setActiveIdx}
              />
              <FiltersSection flat={false} onPartialClick={() => setActiveTab('actions')} />
              <PanelsSection onToggleRawPanel={onToggleRawPanel} rawPanelActive={rawPanelActive} />
            </>
          )}

          {activeTab === 'messages' && (
            <>
              <MessageResultList
                results={messageResults}
                activeIdx={activeIdx}
                query={query}
                showSection={false}
                listRef={listRef}
                onJumpTo={onJumpTo}
                onClose={onClose}
                setActiveIdx={setActiveIdx}
              />
              {q && messageResults.length === 0 && (
                <div
                  style={{
                    padding: '32px 16px',
                    textAlign: 'center',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    color: '#3e3e42',
                  }}
                >
                  <div style={{ fontSize: '24px', marginBottom: '8px', opacity: 0.4 }}>∅</div>
                  no matches for <span style={{ color: '#d97757' }}>"{query}"</span>
                </div>
              )}
            </>
          )}

          {activeTab === 'actions' && (
            <ActionsTab
              flat={false}
              onToggleRawPanel={onToggleRawPanel}
              rawPanelActive={rawPanelActive}
            />
          )}
        </div>

        <div
          style={{
            borderTop: '1px solid #2a2c30',
            padding: '6px 16px',
            display: 'flex',
            gap: '16px',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: '9px',
              fontFamily: 'monospace',
              color: '#3a3a3e',
              letterSpacing: '0.05em',
            }}
          >
            {q
              ? `${messageResults.length} result${messageResults.length === 1 ? '' : 's'}`
              : `${visibleMessages.length} messages`}
          </span>
          <span
            style={{
              fontSize: '9px',
              fontFamily: 'monospace',
              color: '#3a3a3e',
              letterSpacing: '0.05em',
              marginLeft: 'auto',
            }}
          >
            ↑↓ navigate · ↵ jump · esc close
          </span>
        </div>
      </div>
    </div>
  );
}
