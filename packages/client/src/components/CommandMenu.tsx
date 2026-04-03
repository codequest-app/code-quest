import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useChannelCompose, useChannelConfig, useChannelMessages } from '../contexts/channel';
import { findModel } from '../utils/model-utils';
import { navigateItems } from '../utils/navigate-items';
import { buildMenuItems, DEFAULT_EFFORT_LEVELS, type MenuItem } from './command-menu-items';
import { MenuItemRow, MenuSection } from './command-menu-parts';

export interface CommandMenuProps {
  // Dialog callbacks — managed by parent (ComposeToolbar)
  onOpenModelPicker?: () => void;
  onOpenAccountUsage?: () => void;
  onMcpStatus?: () => void;
  onToggleMcp?: () => void;
  onManagePlugins?: () => void;
  onOpenConfig?: () => void;
  onSwitchAccount?: () => void;
  onOpenHelp?: () => void;
  onResumeConversation?: () => void;
  onAttachFile?: () => void;
}

export function CommandMenu({
  onResumeConversation,
  onOpenModelPicker,
  onOpenAccountUsage,
  onMcpStatus,
  onToggleMcp,
  onManagePlugins,
  onOpenConfig,
  onSwitchAccount,
  onOpenHelp,
  onAttachFile,
}: CommandMenuProps) {
  // Context
  const { sendMessage, clearMessages, clearModifiedFiles } = useChannelMessages();
  const {
    model,
    availableModels,
    effort,
    thinkingLevel,
    isFastMode,
    fastModeState,
    slashCommands,
    setEffort: onSetEffort,
    setThinkingLevel: onSetThinkingLevel,
    setFastMode,
  } = useChannelConfig();
  const compose = useChannelCompose();

  // Compute modelLabel
  const models = availableModels ?? [];
  const currentModel = model ?? null;
  const modelEntry = (currentModel ? findModel(currentModel, models) : undefined) ?? models[0];
  const modelLabel = modelEntry?.label ?? modelEntry?.displayName ?? currentModel ?? 'Default';

  const supportsFastMode = modelEntry?.supportsFastMode ?? false;
  const effortLevels =
    modelEntry?.supportedEffortLevels ?? (modelEntry?.supportsEffort ? DEFAULT_EFFORT_LEVELS : []);

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

  const isThinkingOn = thinkingLevel !== 'off' && thinkingLevel !== 'disabled';

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) {
        setButtonOpen(false);
        setFilter('');
        compose.closeSlash();
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [open, compose.closeSlash]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setButtonOpen(false);
        setFilter('');
        compose.closeSlash();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, compose.closeSlash]);

  useEffect(() => {
    // Only focus the filter input when opened via button click
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

  const close = () => {
    setButtonOpen(false);
    setFilter('');
    setActiveId(null);
    compose.closeSlash();
    compose.focusTextarea();
  };
  const closeRef = useRef(close);
  useLayoutEffect(() => {
    closeRef.current = close;
  });

  // When externally opened (typing /), handle navigation keys at document level
  useEffect(() => {
    if (!externalOpen) return;
    const handleNavKey = (e: KeyboardEvent) => {
      const items = flatItemsRef.current;
      if (!['ArrowDown', 'ArrowUp', 'Enter', 'Tab'].includes(e.key)) return;
      if (items.length === 0) return;
      e.preventDefault();
      setActiveId((prev) => {
        const { newActiveId, shouldSelect } = navigateItems(e.key, items, prev);
        if (shouldSelect) {
          const item = items.find((i) => i.id === newActiveId);
          if (item?.id.startsWith('slash-')) {
            if (e.key === 'Tab' || hasTextBeforeSlashRef.current) {
              insertSlashCommandRef.current(`${item.label} `);
            } else {
              executeSlashCommandRef.current(item.label);
            }
            closeRef.current();
          } else if (item) {
            item.onClick?.();
          }
        }
        return newActiveId;
      });
    };
    document.addEventListener('keydown', handleNavKey);
    return () => document.removeEventListener('keydown', handleNavKey);
  }, [externalOpen]);

  // Build menu items (pure function, no deps on component state)
  const sections = buildMenuItems({
    slashCommands,
    effort,
    effortLevels,
    isThinkingOn,
    isFastMode,
    fastModeState,
    modelLabel,
    supportsFastMode,
    onSetEffort,
    onSetThinkingLevel,
    setFastMode,
    close,
    compose: { mentionFile: compose.mentionFile, executeSlashCommand: compose.executeSlashCommand },
    actions: { sendMessage, clearMessages, clearModifiedFiles },
    callbacks: {
      onAttachFile,
      onResumeConversation,
      onOpenModelPicker,
      onOpenAccountUsage,
      onMcpStatus,
      onToggleMcp,
      onManagePlugins,
      onOpenConfig,
      onSwitchAccount,
      onOpenHelp,
    },
  });
  const {
    context: contextItems,
    model: modelItems,
    customize: customizeItems,
    tools: toolsItems,
    slash: slashItems,
    settings: settingsItems,
    support: supportItems,
  } = sections;

  // Filter — filterOnly items only appear when filter text is non-empty
  const f = effectiveFilter.toLowerCase();
  const filterItems = (items: MenuItem[]) => {
    return items.filter((i) => {
      if (i.filterOnly && !f) return false;
      if (f) return i.label.toLowerCase().includes(f);
      return true;
    });
  };

  const filteredContext = filterItems(contextItems);
  const filteredModel = filterItems(modelItems);
  const filteredCustomize = filterItems(customizeItems);
  const filteredTools = filterItems(toolsItems);
  const filteredSlash = filterItems(slashItems);
  const filteredSettings = filterItems(settingsItems);
  const filteredSupport = filterItems(supportItems);

  // Include "Switch model" in model section filter check
  const switchModelVisible = (!f || 'switch model'.includes(f)) && !!onOpenModelPicker;
  const modelSectionVisible = !f || switchModelVisible || filteredModel.length > 0;

  // Build flat navigable item list (matches render order)
  const switchModelItem: MenuItem | null = switchModelVisible
    ? {
        id: 'switch-model',
        label: 'Switch model',
        section: 'Model',
        onClick: () => {
          onOpenModelPicker?.();
          close();
        },
      }
    : null;

  const flatItems: MenuItem[] = [
    ...filteredContext,
    ...(modelSectionVisible
      ? [...(switchModelItem ? [switchModelItem] : []), ...filteredModel]
      : []),
    ...filteredCustomize,
    ...filteredTools,
    ...filteredSlash,
    ...filteredSettings,
    ...filteredSupport,
  ];
  useLayoutEffect(() => {
    flatItemsRef.current = flatItems;
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
    if (!['ArrowDown', 'ArrowUp', 'Enter', 'Tab'].includes(e.key)) return;
    e.preventDefault();
    const { newActiveId, shouldSelect } = navigateItems(e.key, flatItems, activeId);
    setActiveId(newActiveId);
    if (shouldSelect) {
      const item = flatItems.find((i) => i.id === newActiveId);
      if (item?.id.startsWith('slash-')) {
        if (e.key === 'Tab') {
          compose.insertSlashCommand(`${item.label} `);
        } else {
          // Button-opened menu: no preceding text → execute
          compose.executeSlashCommand(item.label);
        }
        close();
      } else if (item) {
        item.onClick?.();
      }
    }
  };

  const isActive = (id: string) => id === activeId;

  return (
    <div ref={menuRef}>
      <button
        type="button"
        title="Show command menu (/)"
        onClick={() => setButtonOpen((v) => !v)}
        className="w-[26px] h-[26px] flex items-center justify-center rounded text-text-muted hover:text-text hover:bg-white/5 transition-colors"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M14 4.5C14.8284 4.5 15.5 5.17157 15.5 6V14C15.5 14.8284 14.8284 15.5 14 15.5H6C5.17157 15.5 4.5 14.8284 4.5 14V6C4.5 5.17157 5.17157 4.5 6 4.5H14ZM6 5.5C5.72386 5.5 5.5 5.72386 5.5 6V14L5.50977 14.1006C5.55629 14.3286 5.75829 14.5 6 14.5H14L14.1006 14.4902C14.2961 14.4503 14.4503 14.2961 14.4902 14.1006L14.5 14V6C14.5 5.75829 14.3286 5.55629 14.1006 5.50977L14 5.5H6ZM11.0527 6.77734C11.1762 6.53042 11.4767 6.4294 11.7236 6.55273C11.9704 6.67627 12.0706 6.97676 11.9473 7.22363L8.94727 13.2236C8.82381 13.4701 8.52409 13.5701 8.27734 13.4473C8.03042 13.3238 7.9294 13.0233 8.05273 12.7764L11.0527 6.77734Z"
            fill="currentColor"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-surface border border-border rounded-lg shadow-lg z-50 text-[13px] max-h-[50vh] overflow-hidden animate-slide-up">
          {/* Filter input — hidden when externally opened (typing / in textarea acts as filter) */}
          {externalOpen ? (
            <div className="h-1" />
          ) : (
            <div className="p-1">
              <input
                ref={filterRef}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                onKeyDown={handleFilterKeyDown}
                placeholder="Filter actions..."
                className="w-full bg-input text-text placeholder:text-text-muted outline-none rounded px-3 py-2 text-[0.9em]"
              />
            </div>
          )}
          <div className="overflow-y-auto overflow-x-hidden scrollbar-thin pb-2 max-h-[calc(50vh-44px)] flex flex-col gap-[2px]">
            {flatItems.length === 0 ? (
              <div className="px-3 py-2 text-center text-text-muted text-[0.9em]">
                No matching commands
              </div>
            ) : (
              <>
                <MenuSection
                  label="Context"
                  items={filteredContext}
                  activeId={activeId}
                  activeItemRef={activeItemRef}
                  onHover={setActiveId}
                  isFirst
                />

                {modelSectionVisible && (
                  <>
                    {filteredContext.length > 0 && <div className="h-px bg-border my-1" />}
                    <div className="px-3 py-1 text-[0.9em] opacity-50 text-text">Model</div>
                    {switchModelVisible && switchModelItem && (
                      <MenuItemRow
                        item={{
                          id: 'switch-model',
                          label: 'Switch model',
                          section: 'Model',
                          trailing: (
                            <span
                              className={`font-mono text-[11px] ${isActive('switch-model') ? 'text-white/70' : 'text-text-muted'}`}
                            >
                              {modelLabel}
                            </span>
                          ),
                          onClick: () => {
                            onOpenModelPicker?.();
                            close();
                          },
                        }}
                        isActive={isActive('switch-model')}
                        activeItemRef={activeItemRef}
                        onHover={setActiveId}
                      />
                    )}
                    {filteredModel.map((item) => (
                      <MenuItemRow
                        key={item.id}
                        item={item}
                        isActive={isActive(item.id)}
                        activeItemRef={activeItemRef}
                        onHover={setActiveId}
                      />
                    ))}
                  </>
                )}

                <MenuSection
                  label="Customize"
                  items={filteredCustomize}
                  activeId={activeId}
                  activeItemRef={activeItemRef}
                  onHover={setActiveId}
                />
                <MenuSection
                  label="Tools"
                  items={filteredTools}
                  activeId={activeId}
                  activeItemRef={activeItemRef}
                  onHover={setActiveId}
                />
                <MenuSection
                  label="Slash Commands"
                  items={filteredSlash}
                  activeId={activeId}
                  activeItemRef={activeItemRef}
                  onHover={setActiveId}
                />
                <MenuSection
                  label="Settings"
                  items={filteredSettings}
                  activeId={activeId}
                  activeItemRef={activeItemRef}
                  onHover={setActiveId}
                />
                <MenuSection
                  label="Support"
                  items={filteredSupport}
                  activeId={activeId}
                  activeItemRef={activeItemRef}
                  onHover={setActiveId}
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
