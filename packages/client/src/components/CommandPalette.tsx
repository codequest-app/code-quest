import { useEffect, useRef, useState } from 'react';
import { useChannelMessages, useMessageVisibility } from '../contexts/channel';
import { createColorThemeFeature } from '../features/color-theme/color-theme-feature';
import { createDensityFeature } from '../features/density/density-feature';
import { createFilterFeatures } from '../features/filters/create-filter-features';
import { createFontSizeFeature } from '../features/font-size/font-size-feature';
import { createRawPanelFeature } from '../features/raw-panel/raw-panel-feature';
import type { Feature, PaletteTab } from '../lib/feature';
import { usePreferencesStore } from '../stores/usePreferencesStore';
import { cn } from '../utils/cn';
import { isMessageVisible, messagePreview } from '../utils/isMessageVisible';
import { PaletteCommandList } from './palette/PaletteCommandList';
import { PaletteEmpty } from './palette/PaletteEmpty';
import { PaletteMessageList } from './palette/PaletteMessageList';
import { paletteMessageResults } from './palette/palette-message-results';
import { SearchField } from './ui/SearchField';

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

const isPaletteTab = (t: TabId): t is PaletteTab => t !== 'messages';

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
  const messageResults = paletteMessageResults(visibleMessages, query);

  const featuresInActiveTab = isPaletteTab(activeTab)
    ? paletteFeatures.filter((f) => (f.tabs ?? ['all']).includes(activeTab))
    : [];
  const hasFeatureMatch = q
    ? featuresInActiveTab.some((f) => f.label.toLowerCase().includes(q))
    : featuresInActiveTab.length > 0;

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
      className="fixed inset-0 z-palette flex items-start justify-center pt-[10vh] bg-overlay backdrop-blur-[2px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div
        data-testid="command-palette-dialog"
        className="w-160 max-w-[calc(100vw-48px)] max-h-[70vh] flex flex-col overflow-hidden rounded-lg border border-floating-border floating-popover-lg"
      >
        <div role="tablist" className="flex border-b border-floating-border-subtle shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider border-b-2 cursor-pointer transition-colors',
                activeTab === tab.id
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-subtle',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <SearchField
          value={query}
          onChange={setQuery}
          onKeyDown={handleKey}
          placeholder="Search messages or type a command…"
          inputRef={inputRef}
        />

        <div className="overflow-y-auto flex-1">
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
              {messageResults.length === 0 && <PaletteEmpty query={query} />}
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
              {q && !hasFeatureMatch && messageResults.length === 0 && (
                <PaletteEmpty query={query} />
              )}
            </>
          )}
        </div>

        <div className="border-t border-floating-border-subtle px-4 py-1.5 flex gap-4 shrink-0">
          <span className="text-xs font-mono text-text-faint tracking-wider">
            {q
              ? `${messageResults.length} result${messageResults.length === 1 ? '' : 's'}`
              : `${visibleMessages.length} messages`}
          </span>
          <span className="text-xs font-mono text-text-faint tracking-wider ml-auto">
            ↑↓ navigate · ↵ jump · esc close
          </span>
        </div>
      </div>
    </div>
  );
}
