import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useChannelCompose, useChannelConfig, useChannelMessages } from '../contexts/channel';
import { findModel } from '../utils/model-utils';
import { navigateItems } from '../utils/navigate-items';
import { EffortSwitch } from './icons/EffortSwitch';
import { ToggleSwitch } from './ui/ToggleSwitch';

const DEFAULT_EFFORT_LEVELS: string[] = ['low', 'medium', 'high', 'max'];

interface MenuItem {
  id: string;
  label: string;
  section: string;
  disabled?: boolean;
  filterOnly?: boolean;
  trailing?: React.ReactNode;
  onClick?: () => void;
}

interface MenuSections {
  context: MenuItem[];
  model: MenuItem[];
  customize: MenuItem[];
  tools: MenuItem[];
  slash: MenuItem[];
  settings: MenuItem[];
  support: MenuItem[];
}

interface BuildMenuItemsParams {
  slashCommands: string[];
  effort: 'low' | 'medium' | 'high' | 'max' | null;
  effortLevels: string[];
  isThinkingOn: boolean;
  isFastMode: boolean;
  fastModeState: string | null;
  modelLabel: string;
  supportsFastMode: boolean;
  onSetEffort: (effort: string) => void;
  onSetThinkingLevel: (level: string) => void;
  setFastMode: (enabled: boolean) => void;
  close: () => void;
  compose: { mentionFile: () => void; executeSlashCommand: (cmd: string) => void };
  actions: {
    sendMessage: (msg: string) => void;
    clearMessages: () => void;
    clearModifiedFiles: () => void;
  };
  callbacks: {
    onAttachFile?: () => void;
    onResumeConversation?: () => void;
    onOpenModelPicker?: () => void;
    onOpenAccountUsage?: () => void;
    onMcpStatus?: () => void;
    onToggleMcp?: () => void;
    onManagePlugins?: () => void;
    onOpenConfig?: () => void;
    onSwitchAccount?: () => void;
    onOpenHelp?: () => void;
  };
}

function buildMenuItems(params: BuildMenuItemsParams): MenuSections {
  const {
    slashCommands,
    effort,
    effortLevels,
    isThinkingOn,
    isFastMode,
    fastModeState,
    supportsFastMode,
  } = params;
  const { onSetEffort, onSetThinkingLevel, setFastMode, close, compose, actions, callbacks } =
    params;

  const context: MenuItem[] = [
    {
      id: 'attach-file',
      label: 'Attach file…',
      section: 'Context',
      onClick: () => {
        callbacks.onAttachFile?.();
        close();
      },
    },
    {
      id: 'mention-file',
      label: 'Mention file from this project...',
      section: 'Context',
      onClick: () => {
        compose.mentionFile();
        close();
      },
    },
    {
      id: 'clear-conversation',
      label: 'Clear conversation',
      section: 'Context',
      onClick: () => {
        actions.clearMessages();
        actions.clearModifiedFiles();
        close();
      },
    },
    {
      id: 'new-conversation',
      label: 'New conversation',
      section: 'Context',
      filterOnly: true,
      onClick: () => {
        actions.sendMessage('/new');
        close();
      },
    },
    {
      id: 'resume-conversation',
      label: 'Resume conversation',
      section: 'Context',
      filterOnly: true,
      onClick: () => {
        callbacks.onResumeConversation?.();
        close();
      },
    },
  ];

  const model: MenuItem[] = [
    {
      id: 'effort-level',
      label: 'Effort',
      section: 'Model',
      trailing: (
        <EffortSwitch level={effort ?? undefined} levels={effortLevels} onSelect={onSetEffort} />
      ),
      onClick: () => {
        if (effortLevels.length === 0) return;
        const idx = effort ? effortLevels.indexOf(effort) : -1;
        onSetEffort(effortLevels[(idx + 1) % effortLevels.length]);
      },
    },
    {
      id: 'toggle-thinking',
      label: 'Thinking',
      section: 'Model',
      trailing: <ToggleSwitch isOn={isThinkingOn} />,
      onClick: () => onSetThinkingLevel(isThinkingOn ? 'off' : 'default_on'),
    },
    {
      id: 'account-usage',
      label: 'Account & usage…',
      section: 'Model',
      onClick: () => {
        callbacks.onOpenAccountUsage?.();
        close();
      },
    },
    ...(supportsFastMode
      ? [
          {
            id: 'fast-mode',
            label: 'Toggle fast mode',
            section: 'Model' as const,
            trailing: <ToggleSwitch isOn={isFastMode} />,
            onClick: () => setFastMode(fastModeState === 'off' || !fastModeState),
          },
        ]
      : []),
  ];

  const customize: MenuItem[] = [
    {
      id: 'mcp-status',
      label: 'MCP status',
      section: 'Customize',
      onClick: () => {
        callbacks.onMcpStatus?.();
        close();
      },
    },
    {
      id: 'mcp-servers',
      label: 'Manage MCP servers',
      section: 'Customize',
      onClick: () => {
        callbacks.onToggleMcp?.();
        close();
      },
    },
    {
      id: 'plugins',
      label: 'Manage plugins',
      section: 'Customize',
      onClick: () => {
        callbacks.onManagePlugins?.();
        close();
      },
    },
  ];

  const tools: MenuItem[] = [
    {
      id: 'chrome-mcp',
      label: 'Enable Chrome MCP',
      section: 'Tools',
      onClick: () => {
        toast.info('Chrome MCP is not available in the web app');
        close();
      },
    },
    {
      id: 'jupyter-mcp',
      label: 'Enable Jupyter MCP',
      section: 'Tools',
      onClick: () => {
        toast.info('Jupyter MCP is not available in the web app');
        close();
      },
    },
    {
      id: 'debugger-help',
      label: 'Debugger Help',
      section: 'Tools',
      onClick: () => {
        toast.info('Debugger integration is not available in the web app');
        close();
      },
    },
  ];

  const settings: MenuItem[] = [
    {
      id: 'general-config',
      label: 'General config…',
      section: 'Settings',
      onClick: () => {
        callbacks.onOpenConfig?.();
        close();
      },
    },
    {
      id: 'switch-account',
      label: 'Switch account',
      section: 'Settings',
      onClick: () => {
        callbacks.onSwitchAccount?.();
        close();
      },
    },
  ];

  const support: MenuItem[] = [
    {
      id: 'view-help',
      label: 'View help docs',
      section: 'Support',
      onClick: () => {
        callbacks.onOpenHelp?.();
        close();
      },
    },
  ];

  const slash: MenuItem[] = slashCommands.map((cmd) => ({
    id: `slash-${cmd}`,
    label: `/${cmd}`,
    section: 'Slash Commands',
    onClick: () => {
      compose.executeSlashCommand(`/${cmd}`);
      close();
    },
  }));

  return { context, model, customize, tools, slash, settings, support };
}

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

interface MenuItem {
  id: string;
  label: string;
  section: string;
  disabled?: boolean;
  filterOnly?: boolean;
  trailing?: React.ReactNode;
  onClick?: () => void;
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
  insertSlashCommandRef.current = compose.insertSlashCommand;
  const executeSlashCommandRef = useRef(compose.executeSlashCommand);
  executeSlashCommandRef.current = compose.executeSlashCommand;
  const hasTextBeforeSlashRef = useRef(compose.hasTextBeforeSlash);
  hasTextBeforeSlashRef.current = compose.hasTextBeforeSlash;

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
  closeRef.current = close;

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
  flatItemsRef.current = flatItems;

  // Auto-select first matching item when filter changes
  const flatItemIds = flatItems.map((i) => i.id);
  const firstItemId = flatItemIds[0] ?? null;
  const flatItemIdKey = flatItemIds.join(',');
  useEffect(() => {
    if (!f) {
      setActiveId(null);
      return;
    }
    setActiveId((prev) => {
      if (!firstItemId) return null;
      if (prev && flatItemIdKey.includes(prev)) return prev;
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

  const renderItem = (item: MenuItem) => {
    const active = isActive(item.id);
    return (
      <button
        key={item.id}
        ref={active ? activeItemRef : null}
        type="button"
        disabled={item.disabled}
        onClick={item.onClick}
        onMouseEnter={() => setActiveId(item.id)}
        className={`text-left px-2 py-1 mx-1 rounded flex items-center justify-between disabled:text-text-muted disabled:cursor-not-allowed ${
          active ? 'bg-selected text-white' : 'text-text hover:bg-white/10'
        }`}
      >
        <span>{item.label}</span>
        {item.trailing && <span>{item.trailing}</span>}
      </button>
    );
  };

  const renderSection = (label: string, items: MenuItem[], isFirst = false) =>
    items.length > 0 ? (
      <>
        {!isFirst && <div className="h-px bg-border my-1" />}
        <div className="px-3 py-1 text-[0.9em] opacity-50 text-text">{label}</div>
        {items.map(renderItem)}
      </>
    ) : null;

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
                {/* Context section */}
                {renderSection('Context', filteredContext, true)}

                {/* Model section */}
                {modelSectionVisible && (
                  <>
                    {filteredContext.length > 0 && <div className="h-px bg-border my-1" />}
                    <div className="px-3 py-1 text-[0.9em] opacity-50 text-text">Model</div>
                    {/* Switch model — opens model picker panel */}
                    {switchModelVisible && switchModelItem && (
                      <button
                        ref={isActive('switch-model') ? activeItemRef : null}
                        type="button"
                        onClick={() => {
                          onOpenModelPicker?.();
                          close();
                        }}
                        onMouseEnter={() => setActiveId('switch-model')}
                        className={`text-left px-2 py-1 mx-1 rounded flex items-center justify-between ${
                          isActive('switch-model')
                            ? 'bg-selected text-white'
                            : 'text-text hover:bg-white/10'
                        }`}
                      >
                        <span>Switch model</span>
                        <span
                          className={`font-mono text-[11px] ${isActive('switch-model') ? 'text-white/70' : 'text-text-muted'}`}
                        >
                          {modelLabel}
                        </span>
                      </button>
                    )}
                    {filteredModel.map(renderItem)}
                  </>
                )}

                {/* Customize section */}
                {renderSection('Customize', filteredCustomize)}

                {/* Tools section (web stubs) */}
                {renderSection('Tools', filteredTools)}

                {/* Slash Commands section */}
                {renderSection('Slash Commands', filteredSlash)}

                {/* Settings section */}
                {renderSection('Settings', filteredSettings)}

                {/* Support section */}
                {renderSection('Support', filteredSupport)}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
