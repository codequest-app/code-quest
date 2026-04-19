import { useEffect, useRef, useState } from 'react';
import { useChannelMessages, useMessageVisibility } from '../contexts/channel';
import { createColorThemeFeature } from '../features/color-theme/color-theme-feature';
import { createDensityFeature } from '../features/density/density-feature';
import { createFilterFeatures } from '../features/filters/create-filter-features';
import { createFontSizeFeature } from '../features/font-size/font-size-feature';
import { createRawPanelFeature } from '../features/raw-panel/raw-panel-feature';
import type { Feature, PaletteTab } from '../lib/feature';
import { usePreferencesStore } from '../stores/usePreferencesStore';
import { isMessageVisible, messagePreview } from '../utils/isMessageVisible';
import { PaletteCommandList } from './palette/PaletteCommandList';
import { PaletteMessageList } from './palette/PaletteMessageList';

const RECENT_COUNT = 8;

/**
 * Tab bar config. 'messages' is a pseudo-tab backed by PaletteMessageList
 * (not a Feature); other tabs render features whose `tabs` field includes
 * that tab id. Features without `tabs` default to ['all'].
 */
const TABS = [
  { id: 'all', label: 'All' },
  { id: 'messages', label: 'Messages' },
  { id: 'actions', label: 'Actions' },
] as const;

type TabId = (typeof TABS)[number]['id'];

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
  const { enabledTypes, unknownTypes, toggleType } = useMessageVisibility();
  const colorTheme = usePreferencesStore((s) => s.colorTheme);
  const setColorTheme = usePreferencesStore((s) => s.setColorTheme);
  const density = usePreferencesStore((s) => s.density);
  const setDensity = usePreferencesStore((s) => s.setDensity);
  const fontSize = usePreferencesStore((s) => s.fontSize);
  const setFontSize = usePreferencesStore((s) => s.setFontSize);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>(TABS[0].id);
  const [activeIdx, setActiveIdx] = useState(0);
  const [activeFeatureId, setActiveFeatureId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const latestByType = new Map<string, string>();
  for (const msg of messages) latestByType.set(msg.type, messagePreview(msg));

  const paletteFeatures: Feature[] = [
    ...createFilterFeatures({ enabledTypes, unknownTypes, toggleType, latestByType }),
    createRawPanelFeature({
      active: rawPanelActive,
      onToggle: onToggleRawPanel ?? (() => {}),
    }),
    createColorThemeFeature({ colorTheme, setColorTheme }),
    createDensityFeature({ density, setDensity }),
    createFontSizeFeature({ fontSize, setFontSize }),
  ];

  const visibleMessages = messages.filter(
    (m) => isMessageVisible(m, enabledTypes) && m.content.length > 0,
  );
  const q = query.trim().toLowerCase();

  const messageResults = q
    ? visibleMessages.filter((m) => messagePreview(m).toLowerCase().includes(q)).slice(0, 50)
    : visibleMessages.slice(-RECENT_COUNT);

  const featuresInActiveTab =
    activeTab === 'messages'
      ? []
      : paletteFeatures.filter((f) => (f.tabs ?? ['all']).includes(activeTab as PaletteTab));

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIdx(0);
      setActiveTab(TABS[0].id);
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
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 16px',
                fontSize: '11px',
                fontFamily: 'monospace',
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #d97757' : '2px solid transparent',
                color: activeTab === tab.id ? '#d97757' : '#6a6a6e',
                cursor: 'pointer',
                transition: 'color 0.1s, border-color 0.1s',
              }}
            >
              {tab.label}
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
          {activeTab === 'messages' ? (
            <>
              <PaletteMessageList
                messages={visibleMessages}
                query={query}
                activeIdx={activeIdx}
                onActiveChange={setActiveIdx}
                onJumpTo={onJumpTo}
                onClose={onClose}
                listRef={listRef}
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
          ) : (
            <>
              {activeTab === 'all' && (
                <PaletteMessageList
                  messages={visibleMessages}
                  query={query}
                  activeIdx={activeIdx}
                  onActiveChange={setActiveIdx}
                  onJumpTo={onJumpTo}
                  onClose={onClose}
                  showHeader
                  listRef={listRef}
                />
              )}
              <PaletteCommandList
                features={featuresInActiveTab}
                query={query}
                activeId={activeFeatureId}
                onActiveChange={setActiveFeatureId}
              />
            </>
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
