import { type EffortLevel, effortLevelSchema } from '@code-quest/shared';
import { EffortSwitch } from './icons/EffortSwitch';
import { ToggleSwitch } from './ui/ToggleSwitch';

export interface MenuItem {
  id: string;
  label: string;
  section: string;
  disabled?: boolean;
  filterOnly?: boolean;
  /** Match only the first word of the filter text (e.g. "/btw <question>" → match on "btw") */
  matchFirstToken?: boolean;
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

export interface BuildMenuItemsParams {
  slashCommands: string[];
  slashFilter: string | null;
  effort: EffortLevel | null;
  effortLevels: EffortLevel[];
  isThinkingOn: boolean;
  isFastMode: boolean;
  fastModeState: 'on' | 'off' | null;
  modelLabel: string;
  supportsFastMode: boolean;
  onSetEffort: (effort: string) => void;
  onSetThinkingLevel: (level: string) => void;
  setFastMode: (enabled: boolean) => void;
  close: () => void;
  closeSilent: () => void;
  compose: { mentionFile: () => void; executeSlashCommand: (cmd: string) => void };
  actions: {
    sendMessage: (msg: string) => void;
    clearMessages: () => void;
    clearModifiedFiles: () => void;
  };
  callbacks: {
    onAttachFile?: () => void;
    onRewind?: () => void;
    onResumeConversation?: () => void;
    onOpenModelPicker?: () => void;
    onOpenAccountUsage?: () => void;
    onMcpStatus?: () => void;
    onToggleMcp?: () => void;
    onManagePlugins?: () => void;
    onOpenConfig?: () => void;
    onSwitchAccount?: () => void;
    onOpenHelp?: () => void;
    onAskSideQuestion?: (question: string) => void;
  };
}

export const DEFAULT_EFFORT_LEVELS: EffortLevel[] = effortLevelSchema.options;

const EMPTY_TOOLS: MenuItem[] = [];

export function buildMenuItems(params: BuildMenuItemsParams): MenuSections {
  const {
    slashCommands,
    slashFilter,
    effort,
    effortLevels,
    isThinkingOn,
    isFastMode,
    fastModeState,
    supportsFastMode,
  } = params;
  const {
    onSetEffort,
    onSetThinkingLevel,
    setFastMode,
    close,
    closeSilent,
    compose,
    actions,
    callbacks,
  } = params;

  const context: MenuItem[] = [
    {
      id: 'attach-file',
      label: 'Attach file…',
      section: 'Context',
      onClick: () => {
        callbacks.onAttachFile?.();
        closeSilent();
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
      id: 'rewind',
      label: 'Rewind',
      section: 'Context',
      onClick: () => {
        callbacks.onRewind?.();
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
        closeSilent();
      },
    },
  ];

  const model: MenuItem[] = [
    {
      id: 'effort-level',
      label: effort ? `Effort (${effort.charAt(0).toUpperCase()}${effort.slice(1)})` : 'Effort',
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
        closeSilent();
      },
    },
    ...(supportsFastMode
      ? [
          {
            id: 'fast-mode',
            label: 'Toggle fast mode',
            section: 'Model',
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
        closeSilent();
      },
    },
    {
      id: 'mcp-servers',
      label: 'Manage MCP servers',
      section: 'Customize',
      onClick: () => {
        callbacks.onToggleMcp?.();
        closeSilent();
      },
    },
    {
      id: 'plugins',
      label: 'Manage plugins',
      section: 'Customize',
      onClick: () => {
        callbacks.onManagePlugins?.();
        closeSilent();
      },
    },
  ];

  const tools = EMPTY_TOOLS;

  const settings: MenuItem[] = [
    {
      id: 'general-config',
      label: 'General config…',
      section: 'Settings',
      onClick: () => {
        callbacks.onOpenConfig?.();
        closeSilent();
      },
    },
    {
      id: 'switch-account',
      label: 'Switch account',
      section: 'Settings',
      onClick: () => {
        callbacks.onSwitchAccount?.();
        closeSilent();
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
        closeSilent();
      },
    },
  ];

  const btwQuestion = slashFilter?.startsWith('btw ') ? slashFilter.slice(4).trim() : null;
  const btwItem: MenuItem = {
    id: 'btw',
    label: '/btw',
    section: 'Slash Commands',
    disabled: !btwQuestion,
    matchFirstToken: true,
    onClick: () => {
      if (btwQuestion) {
        callbacks.onAskSideQuestion?.(btwQuestion);
        closeSilent();
      }
    },
  };

  const slash: MenuItem[] = [
    btwItem,
    ...slashCommands.map((cmd) => ({
      id: `slash-${cmd}`,
      label: `/${cmd}`,
      section: 'Slash Commands',
      onClick: () => {
        compose.executeSlashCommand(`/${cmd}`);
        close();
      },
    })),
  ];

  return { context, model, customize, tools, slash, settings, support };
}
