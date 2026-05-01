import {
  BoltIcon,
  BugAntIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import {
  type ComponentType,
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { useMessageVisibilityStore } from '@/stores/useMessageVisibilityStore';

export type GroupId = 'conversation' | 'tools' | 'system' | 'hooks' | 'debug' | 'other';
export type GroupState = 'all' | 'partial' | 'none';

interface Group {
  id: GroupId;
  label: string;
  icon: ComponentType<{ className?: string }>;
  types: string[];
}

export const VISIBILITY_GROUPS: Group[] = [
  {
    id: 'conversation',
    label: 'Conversation',
    icon: ChatBubbleLeftRightIcon,
    types: ['text', 'thinking', 'redacted_thinking'],
  },
  {
    id: 'tools',
    label: 'Tools',
    icon: WrenchScrewdriverIcon,
    types: [
      'tool_use',
      'tool_result',
      'pending_action',
      'action_result',
      'streamlined_tool_use_summary',
      'streamlined_text',
    ],
  },
  {
    id: 'system',
    label: 'System',
    icon: Cog6ToothIcon,
    types: [
      'result',
      'error',
      'task_started',
      'compact_boundary',
      'rate_limit_event',
      'interrupt',
      'slash_command_result',
      'meta',
    ],
  },
  {
    id: 'hooks',
    label: 'Hooks',
    icon: BoltIcon,
    types: ['hook_started', 'hook_response', 'hook_diagnostics'],
  },
  {
    id: 'debug',
    label: 'Debug',
    icon: BugAntIcon,
    types: [
      'tool_use:TodoRead',
      'tool_use:TodoWrite',
      'error:aborted',
      'error:ede_diagnostic',
      'raw_event',
      'unhandled',
      'unknown_delta',
      'content_block_start',
      'image',
      'document',
      'file:updated',
    ],
  },
];

export const OTHER_GROUP_ICON: typeof QuestionMarkCircleIcon = QuestionMarkCircleIcon;

const DEFAULT_ON_GROUPS: GroupId[] = ['conversation', 'tools', 'system'];

export function defaultEnabledTypes(): Set<string> {
  const types = new Set<string>();
  for (const g of VISIBILITY_GROUPS) {
    if (DEFAULT_ON_GROUPS.includes(g.id)) {
      for (const t of g.types) types.add(t);
    }
  }
  return types;
}

interface MessageVisibilityContextValue {
  enabledTypes: Set<string>;
  toggleGroup: (id: GroupId) => void;
  toggleType: (type: string) => void;
  groupState: (id: GroupId) => GroupState;
  registerUnknownType: (type: string) => void;
  unknownTypes: Set<string>;
}

const MessageVisibilityContext = createContext<MessageVisibilityContextValue | null>(null);

const ALL_KNOWN_TYPES = new Set(VISIBILITY_GROUPS.flatMap((g) => g.types));

export function MessageVisibilityProvider({
  children,
}: {
  children: ReactNode;
}): React.JSX.Element {
  const storedTypes = useMessageVisibilityStore((s) => s.enabledTypes);
  const setStoredTypes = useMessageVisibilityStore((s) => s.setEnabledTypes);

  const enabledTypes = useMemo(
    () => (storedTypes !== null ? new Set(storedTypes) : defaultEnabledTypes()),
    [storedTypes],
  );

  const [unknownTypes, setUnknownTypes] = useState<Set<string>>(new Set());

  const updateStore = useCallback(
    (updater: (prev: Set<string>) => Set<string>) => {
      const next = updater(enabledTypes);
      setStoredTypes([...next]);
    },
    [enabledTypes, setStoredTypes],
  );

  const toggleTypeSet = useCallback(
    (types: Iterable<string>) => {
      updateStore((prev) => {
        const next = new Set(prev);
        const allOn = [...types].every((t) => next.has(t));
        if (allOn) {
          for (const t of types) next.delete(t);
        } else {
          for (const t of types) next.add(t);
        }
        return next;
      });
    },
    [updateStore],
  );

  const toggleGroup = useCallback(
    (id: GroupId) => {
      if (id === 'other') return toggleTypeSet(unknownTypes);
      const group = VISIBILITY_GROUPS.find((g) => g.id === id);
      if (!group) return;
      toggleTypeSet(group.types);
    },
    [toggleTypeSet, unknownTypes],
  );

  const toggleType = useCallback(
    (type: string) => {
      updateStore((prev) => {
        const next = new Set(prev);
        if (next.has(type)) next.delete(type);
        else next.add(type);
        return next;
      });
    },
    [updateStore],
  );

  const groupState = useCallback(
    (id: GroupId): GroupState => {
      const types =
        id === 'other'
          ? [...unknownTypes]
          : (VISIBILITY_GROUPS.find((g) => g.id === id)?.types ?? []);
      if (types.length === 0) return 'none';
      const on = types.filter((t) => enabledTypes.has(t)).length;
      if (on === 0) return 'none';
      if (on === types.length) return 'all';
      return 'partial';
    },
    [enabledTypes, unknownTypes],
  );

  const registerUnknownType = useCallback(
    (type: string) => {
      if (ALL_KNOWN_TYPES.has(type)) return;
      if (unknownTypes.has(type)) return;
      setUnknownTypes((prev) => {
        const s = new Set(prev);
        s.add(type);
        return s;
      });
      updateStore((prev) => {
        const s = new Set(prev);
        s.add(type);
        return s;
      });
    },
    [unknownTypes, updateStore],
  );

  return (
    <MessageVisibilityContext.Provider
      value={{
        enabledTypes,
        toggleGroup,
        toggleType,
        groupState,
        registerUnknownType,
        unknownTypes,
      }}
    >
      {children}
    </MessageVisibilityContext.Provider>
  );
}

export function useMessageVisibility(): MessageVisibilityContextValue {
  const ctx = useContext(MessageVisibilityContext);
  if (!ctx) throw new Error('useMessageVisibility must be used within MessageVisibilityProvider');
  return ctx;
}
