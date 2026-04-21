import { type RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useChannelCompose, useChannelConfig } from '../../contexts/channel';
import { useFeatureRegistry } from '../../contexts/channel/FeatureRegistryContext';
import { createAttachFileFeature } from '../../features/attach-file/attach-file-feature';
import { createBtwLocalFeature } from '../../features/btw/btw-feature';
import { createEffortFeature } from '../../features/effort/effort-feature';
import { createFastModeFeature } from '../../features/fast-mode/fast-mode-feature';
import { createGeneralConfigFeature } from '../../features/general-config/general-config-feature';
import { createManagePluginsFeature } from '../../features/manage-plugins/manage-plugins-feature';
import { createMcpServersFeature } from '../../features/mcp-servers/mcp-servers-feature';
import { createMcpStatusFeature } from '../../features/mcp-status/mcp-status-feature';
import { createModelFeature } from '../../features/model/model-feature';
import { createSwitchAccountFeature } from '../../features/switch-account/switch-account-feature';
import { createThinkingFeature } from '../../features/thinking/thinking-feature';
import { createViewHelpFeature } from '../../features/view-help/view-help-feature';
import { cn } from '../../utils/cn';
import { findModel, getEffortLevels } from '../../utils/model-utils';
import { openUrl } from '../../utils/open-url';
import { IconButton } from '../ui/IconButton';
import { SlashCommandIcon } from '../ui/Icons';
import { buildMenuItems, type MenuItem } from './build-menu-items';
import { computeMenuLayout } from './menu-layout';
import { slashPaletteState } from './slash-palette-state';

function MenuItemRow({
  item,
  isActive,
  activeItemRef,
  onHover,
}: {
  item: MenuItem;
  isActive: boolean;
  activeItemRef: RefObject<HTMLButtonElement | null>;
  onHover: (id: string) => void;
}) {
  return (
    <button
      ref={isActive ? activeItemRef : null}
      type="button"
      role="menuitem"
      disabled={item.disabled}
      onClick={item.onClick}
      onMouseEnter={() => onHover(item.id)}
      className={cn(
        'text-left px-3 py-1 w-full flex items-center justify-between disabled:text-text-muted disabled:cursor-not-allowed',
        isActive ? 'bg-selected text-white' : 'text-text hover:bg-white/10',
      )}
    >
      <span className="flex items-center gap-1.5">
        {item.label}
        {item.description && (
          <span className="font-mono text-xs text-text-muted">{item.description}</span>
        )}
      </span>
      {item.trailing && <span>{item.trailing}</span>}
    </button>
  );
}

function MenuSection({
  label,
  items,
  activeId,
  activeItemRef,
  onHover,
  isFirst = false,
}: {
  label: string;
  items: MenuItem[];
  activeId: string | null;
  activeItemRef: RefObject<HTMLButtonElement | null>;
  onHover: (id: string) => void;
  isFirst?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <>
      {!isFirst && <div className="h-px bg-border my-1" />}
      {/* biome-ignore lint/a11y/useSemanticElements: role=group on div is correct; fieldset has unwanted browser styling */}
      <div role="group" aria-label={label}>
        <div className="px-3 py-1 text-sm opacity-50 text-text" aria-hidden="true">
          {label}
        </div>
        {items.map((item) => (
          <MenuItemRow
            key={item.id}
            item={item}
            isActive={item.id === activeId}
            activeItemRef={activeItemRef}
            onHover={onHover}
          />
        ))}
      </div>
    </>
  );
}

const NAV_KEYS = ['ArrowDown', 'ArrowUp', 'Enter', 'Tab'] as const;

function navigateItems(
  key: string,
  items: MenuItem[],
  activeId: string | null,
): { newActiveId: string | null; shouldSelect: boolean } {
  if (key === 'Enter' || key === 'Tab') {
    return { newActiveId: activeId, shouldSelect: true };
  }
  if (key === 'ArrowDown' || key === 'ArrowUp') {
    if (items.length === 0) return { newActiveId: activeId, shouldSelect: false };
    const idx = items.findIndex((i) => i.id === activeId);
    let next: number;
    if (key === 'ArrowDown') {
      next = idx < items.length - 1 ? idx + 1 : 0;
    } else {
      next = idx > 0 ? idx - 1 : items.length - 1;
    }
    return { newActiveId: items[next]?.id ?? null, shouldSelect: false };
  }
  return { newActiveId: activeId, shouldSelect: false };
}

export interface CommandMenuProps {
  // Dialog callbacks — managed by parent (ComposeToolbar)
  onMcpStatus?: () => void;
  onToggleMcp?: () => void;
  onManagePlugins?: () => void;
  onAttachFile?: () => void;
  docsUrl?: string;
}

export function CommandMenu({
  onMcpStatus,
  onToggleMcp,
  onManagePlugins,
  onAttachFile,
  docsUrl,
}: CommandMenuProps) {
  // Context
  const {
    model,
    availableModels,
    effort,
    thinkingLevel,
    fastModeState,
    slashCommands,
    setEffort: onSetEffort,
    setThinkingLevel: onSetThinkingLevel,
    setFastMode,
  } = useChannelConfig();
  const compose = useChannelCompose();
  const registry = useFeatureRegistry();

  // Compute modelLabel
  const models = availableModels ?? [];
  const currentModel = model ?? null;
  const modelEntry = (currentModel ? findModel(currentModel, models) : undefined) ?? models[0];
  const modelLabel = modelEntry?.label ?? modelEntry?.displayName ?? currentModel ?? 'Default';

  const supportsFastMode = modelEntry?.supportsFastMode ?? false;
  const effortLevels = getEffortLevels(modelEntry);

  const isThinkingOn = thinkingLevel !== 'off' && thinkingLevel !== 'disabled';

  const btwBaseFeature = registry.getFeatures().find((f) => f.id === 'btw');
  const localFeatures = [
    createModelFeature({ modelLabel }),
    createAttachFileFeature({ onAttachFile }),
    createMcpStatusFeature({ onMcpStatus }),
    createMcpServersFeature({ onToggleMcp }),
    createManagePluginsFeature({ onManagePlugins }),
    createGeneralConfigFeature(),
    createSwitchAccountFeature(),
    createViewHelpFeature({ openUrl, docsUrl }),
    createEffortFeature({ effort, effortLevels, onSetEffort }),
    createThinkingFeature({ isThinkingOn, onSetThinkingLevel }),
    ...(supportsFastMode ? [createFastModeFeature({ fastModeState, setFastMode })] : []),
    ...(btwBaseFeature
      ? [createBtwLocalFeature({ slashFilter: compose.slashFilter, baseFeature: btwBaseFeature })]
      : []),
  ];

  // Compose bindings
  const externalOpen = compose.slashFilter != null;
  const externalFilter = compose.slashFilter ?? '';

  // `buttonOpen` = opened via button click; `externalOpen` = opened via typing /
  const [buttonOpen, setButtonOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLInputElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);

  // Derived: menu is open if either button-click or externally driven
  const open = buttonOpen || !!externalOpen;

  // Effective filter text: from textarea (external) or from filter input (button-click)
  const effectiveFilter = externalOpen ? (externalFilter ?? '') : filter;

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) {
        setButtonOpen(false);
        setFilter('');
        compose.dismissSlash();
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [open, compose.dismissSlash]);

  useEffect(() => {
    if (buttonOpen && !externalOpen) {
      setTimeout(() => filterRef.current?.focus(), 0);
    }
  }, [buttonOpen, externalOpen]);

  // Refs for document-level key handler (avoids dependency on close/onInsertSlashCommand)
  const flatItemsRef = useRef<MenuItem[]>([]);
  const insertSlashCommandRef = useRef(compose.insertSlashCommand);
  const executeSlashCommandRef = useRef(compose.executeSlashCommand);
  const hasTextBeforeSlashRef = useRef(compose.hasTextBeforeSlash);
  useLayoutEffect(() => {
    insertSlashCommandRef.current = compose.insertSlashCommand;
    executeSlashCommandRef.current = compose.executeSlashCommand;
    hasTextBeforeSlashRef.current = compose.hasTextBeforeSlash;
  });

  // Auto-select is handled after flatItems is built (below)

  // Scroll active item into view
  useEffect(() => {
    if (activeId !== null) {
      activeItemRef.current?.scrollIntoView({ behavior: 'instant', block: 'nearest' });
    }
  }, [activeId]);

  const closeSilent = () => {
    setButtonOpen(false);
    setFilter('');
    setActiveId(null);
    compose.closeSlash();
  };
  const close = () => {
    closeSilent();
    compose.focusTextarea();
  };
  const closeRef = useRef(close);
  useLayoutEffect(() => {
    closeRef.current = close;
  });

  function handleNavigateAndSelect(
    key: string,
    items: MenuItem[],
    opts: {
      insertSlash: (text: string) => void;
      executeSlash: (label: string) => void;
      shouldInsert: boolean;
      close: () => void;
    },
  ) {
    setActiveId((prev) => {
      const { newActiveId, shouldSelect } = navigateItems(key, items, prev);
      if (shouldSelect) {
        const item = items.find((i) => i.id === newActiveId);
        if (item?.id.startsWith('slash-')) {
          if (key === 'Tab' || opts.shouldInsert) {
            // insertSlashCommand already sets slashOpen=false; calling close() would
            // invoke clearSlashToken() again with stale state and wipe the inserted value.
            opts.insertSlash(`${item.label} `);
          } else {
            opts.executeSlash(item.label);
            opts.close();
          }
        } else if (item) {
          item.onClick?.();
        }
      }
      return newActiveId;
    });
  }

  // When externally opened (typing /), handle navigation keys at document level
  // biome-ignore lint/correctness/useExhaustiveDependencies: handleNavigateAndSelect stable via React Compiler
  useEffect(() => {
    if (!externalOpen) return;
    const handleNavKey = (e: KeyboardEvent) => {
      const items = flatItemsRef.current;
      if (!(NAV_KEYS as readonly string[]).includes(e.key)) return;
      if (items.length === 0) return;
      e.preventDefault();
      handleNavigateAndSelect(e.key, items, {
        insertSlash: (t) => insertSlashCommandRef.current(t),
        executeSlash: (l) => executeSlashCommandRef.current(l),
        shouldInsert: hasTextBeforeSlashRef.current,
        close: () => closeRef.current(),
      });
    };
    document.addEventListener('keydown', handleNavKey);
    return () => document.removeEventListener('keydown', handleNavKey);
  }, [externalOpen]);

  // Build menu items (pure function, no deps on component state)
  const sections = buildMenuItems({
    slashCommands,
    registry,
    localFeatures,
    close,
    closeSilent,
    compose: { executeSlashCommand: compose.executeSlashCommand },
  });
  const layout = computeMenuLayout(sections, effectiveFilter);
  const {
    context: filteredContext,
    model: filteredModel,
    customize: filteredCustomize,
    slash: filteredSlash,
    settings: filteredSettings,
    support: filteredSupport,
    modelVisible: modelSectionVisible,
    flatItems,
    hasPrev,
  } = layout;
  const f = effectiveFilter.toLowerCase();
  // Typing any whitespace after the slash (e.g. `/test `, `/ wiki`) signals
  // the user is no longer picking from the palette — hide it so Enter can
  // fall through to the normal send path.
  const paletteExternallyVisible = externalOpen && !/\s/.test(effectiveFilter);

  useLayoutEffect(() => {
    flatItemsRef.current = flatItems;
    slashPaletteState.itemsCount = paletteExternallyVisible ? flatItems.length : 0;
  });

  // Auto-select first matching item when filter changes
  const flatItemIds = flatItems.map((i) => i.id);
  const firstItemId = flatItemIds[0] ?? null;
  const flatItemIdKey = flatItemIds.join(',');
  // biome-ignore lint/correctness/useExhaustiveDependencies: flatItemIdKey is stable key for flatItemIds
  useEffect(() => {
    if (!f) {
      setActiveId(null);
      return;
    }
    setActiveId((prev) => {
      if (!firstItemId) return null;
      if (prev && flatItemIds.includes(prev)) return prev;
      return firstItemId;
    });
  }, [f, flatItemIdKey, firstItemId]);

  const handleFilterKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setButtonOpen(false);
      setFilter('');
      setActiveId(null);
      compose.dismissSlash();
      compose.focusTextarea();
      return;
    }
    if (!(NAV_KEYS as readonly string[]).includes(e.key)) return;
    e.preventDefault();
    handleNavigateAndSelect(e.key, flatItems, {
      insertSlash: (t) => compose.insertSlashCommand(t),
      executeSlash: (l) => compose.executeSlashCommand(l),
      shouldInsert: false,
      close,
    });
  };

  return (
    <div ref={menuRef}>
      <IconButton title="Show command menu (/)" onClick={() => setButtonOpen((v) => !v)}>
        <SlashCommandIcon className="w-5 h-5" />
      </IconButton>

      {(buttonOpen || paletteExternallyVisible) && (
        <div
          role="menu"
          className="absolute bottom-full left-0 right-0 mb-2 bg-surface border border-border rounded-lg shadow-lg z-modal text-xs max-h-[50vh] overflow-hidden animate-slide-up"
        >
          <div className={cn(externalOpen ? 'pt-1' : 'p-1')}>
            {!externalOpen && (
              <input
                ref={filterRef}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                onKeyDown={handleFilterKeyDown}
                placeholder="Filter actions..."
                className="w-full bg-input text-text placeholder:text-text-muted outline-none rounded px-3 py-2 text-sm"
              />
            )}
          </div>
          <div className="overflow-y-auto overflow-x-hidden pb-2 max-h-[calc(50vh-44px)] flex flex-col gap-0.5">
            {flatItems.length === 0 ? (
              <div className="px-3 py-2 text-center text-text-muted text-sm">
                No matching commands
              </div>
            ) : (
              [
                { label: 'Context', items: filteredContext, isFirst: true, visible: true },
                {
                  label: 'Model',
                  items: filteredModel,
                  isFirst: !hasPrev.model,
                  visible: modelSectionVisible,
                },
                {
                  label: 'Customize',
                  items: filteredCustomize,
                  isFirst: !hasPrev.customize,
                  visible: true,
                },
                {
                  label: 'Slash Commands',
                  items: filteredSlash,
                  isFirst: !hasPrev.slash,
                  visible: true,
                },
                {
                  label: 'Settings',
                  items: filteredSettings,
                  isFirst: !hasPrev.settings,
                  visible: true,
                },
                {
                  label: 'Support',
                  items: filteredSupport,
                  isFirst: !hasPrev.support,
                  visible: true,
                },
              ]
                .filter((s) => s.visible)
                .map((s) => (
                  <MenuSection
                    key={s.label}
                    label={s.label}
                    items={s.items}
                    activeId={activeId}
                    activeItemRef={activeItemRef}
                    onHover={setActiveId}
                    isFirst={s.isFirst}
                  />
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
