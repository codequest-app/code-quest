import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createMentionFileFeature } from '@/features/mention-file/mention-file-feature';
import type { FeatureRegistry } from '@/lib/feature-registry';
import { getMentionQuery, getSlashQuery } from '@/utils/slash-query';
import { useChannelMessagesActions } from './ChannelMessagesContext.tsx';
import { useChannelId } from './ChannelMetaContext.tsx';
import { useChannelSocketRouter } from './ChannelSocketRouterContext.tsx';
import { useFeatureRegistry } from './FeatureRegistryContext.tsx';
import { composeHandlers } from './handlers/speech.ts';

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface ChannelComposeContextValue {
  value: string;
  hasText: boolean;
  cursorPos: number;
  setCursorPos: (pos: number) => void;
  registerFocus: (fn: (pos?: number) => void) => void;
  focusTextarea: () => void;
  slashOpen: boolean;
  mentionOpen: boolean;
  updateValue: (newValue: string, cursorPos?: number) => void;
  submit: () => void;
  slashFilter: string | null;
  hasTextBeforeSlash: boolean;
  closeSlash: () => void;
  dismissSlash: () => void;
  closeMention: () => void;
  openMention: () => void;
  insertSlashCommand: (text: string) => void;
  executeSlashCommand: (cmd: string) => void;
  mentionFile: () => void;
  registerMentionTrigger: (fn: (value: string, pos: number) => void) => void;
  attachedFiles: File[];
  addAttachments: (files: File[]) => void;
  removeAttachment: (index: number) => void;
}

type ComposeStateValue = Pick<
  ChannelComposeContextValue,
  | 'value'
  | 'hasText'
  | 'cursorPos'
  | 'slashOpen'
  | 'mentionOpen'
  | 'slashFilter'
  | 'hasTextBeforeSlash'
  | 'attachedFiles'
>;
type ComposeActionsValue = Omit<ChannelComposeContextValue, keyof ComposeStateValue>;

const ComposeStateContext = createContext<ComposeStateValue | null>(null);
const ComposeActionsContext = createContext<ComposeActionsValue | null>(null);

export function useChannelCompose(): ChannelComposeContextValue {
  const state = useContext(ComposeStateContext);
  const actions = useContext(ComposeActionsContext);
  if (!state || !actions)
    throw new Error('useChannelCompose must be used within a ChannelComposeProvider');
  return { ...state, ...actions };
}

export function useChannelComposeActions(): ComposeActionsValue {
  const actions = useContext(ComposeActionsContext);
  if (!actions)
    throw new Error('useChannelComposeActions must be used within a ChannelComposeProvider');
  return actions;
}

interface ComposeState {
  value: string;
  cursorPos: number;
  slashOpen: boolean;
  mentionOpen: boolean;
  attachedFiles: File[];
}

function insertAtMentionSite(
  text: string,
  pos: number,
  slashToken: ReturnType<typeof getSlashQuery>,
): string {
  return slashToken
    ? `${text.slice(0, slashToken.start)}@${text.slice(slashToken.end)}`
    : `${text.slice(0, pos)}@${text.slice(pos)}`;
}

function applyMentionFile(prev: ComposeState): ComposeState {
  const token = getSlashQuery(prev.value, prev.cursorPos);
  if (token) {
    return {
      ...prev,
      value: insertAtMentionSite(prev.value, prev.cursorPos, token),
      slashOpen: false,
      mentionOpen: true,
    };
  }
  if (getMentionQuery(prev.value, prev.cursorPos) !== null) {
    return { ...prev, slashOpen: false, mentionOpen: true };
  }
  return {
    ...prev,
    value: insertAtMentionSite(prev.value, prev.cursorPos, null),
    mentionOpen: true,
  };
}

interface ComposeActionCtx {
  stateRef: { current: ComposeState };
  setState: Dispatch<SetStateAction<ComposeState>>;
  sendMessage: (text: string) => void;
  requestFocusRef: { current: ((pos?: number) => void) | null };
  mentionTriggerRef: { current: ((value: string, pos: number) => void) | null };
  registry: FeatureRegistry;
}

function createSlashActions(ctx: ComposeActionCtx, get: () => ComposeState) {
  const { setState, sendMessage, requestFocusRef, registry } = ctx;

  const clearSlashToken = () => {
    setState((prev) => {
      const token = getSlashQuery(prev.value, prev.cursorPos);
      if (!token) return { ...prev, slashOpen: false };
      const newValue = prev.value.slice(0, token.start) + prev.value.slice(token.end);
      return { ...prev, value: newValue.trimEnd() === '' ? '' : newValue, slashOpen: false };
    });
  };

  const insertSlashCommand = (text: string) => {
    const { value: v, cursorPos: pos } = get();
    const token = getSlashQuery(v, pos);
    let newValue: string;
    let cursorAt: number;
    if (token) {
      newValue = v.slice(0, token.start) + text + v.slice(token.end);
      cursorAt = token.start + text.length;
    } else {
      newValue = text;
      cursorAt = text.length;
    }
    setState((prev) => ({ ...prev, value: newValue, slashOpen: false }));
    requestFocusRef.current?.(cursorAt);
  };

  const executeSlashCommand = (cmd: string) => {
    clearSlashToken();
    const feature = registry.findSlashCommand(cmd);
    if (feature?.execute) {
      feature.execute();
    } else {
      sendMessage(cmd);
    }
  };

  return {
    closeSlash: clearSlashToken,
    dismissSlash: () => setState((prev) => ({ ...prev, slashOpen: false })),
    insertSlashCommand,
    executeSlashCommand,
  };
}

function createMentionActions(ctx: ComposeActionCtx, get: () => ComposeState) {
  const { setState, requestFocusRef, mentionTriggerRef, registry } = ctx;

  const mentionFile = () => {
    const snap = get();
    const snapToken = getSlashQuery(snap.value, snap.cursorPos);
    const cursorInsideMention = !snapToken && getMentionQuery(snap.value, snap.cursorPos) !== null;

    if (cursorInsideMention) {
      requestFocusRef.current?.(snap.cursorPos);
      mentionTriggerRef.current?.(snap.value, snap.cursorPos);
      setState((prev) => ({ ...prev, mentionOpen: true }));
      return;
    }

    const focusAt = snapToken ? snapToken.start + 1 : snap.cursorPos + 1;
    const triggeredValue = insertAtMentionSite(snap.value, snap.cursorPos, snapToken);
    setState(applyMentionFile);
    requestFocusRef.current?.(focusAt);
    mentionTriggerRef.current?.(triggeredValue, focusAt);
  };

  registry.register(createMentionFileFeature({ mentionFile }));

  return {
    openMention: () => setState((prev) => ({ ...prev, mentionOpen: true })),
    closeMention: () => setState((prev) => ({ ...prev, mentionOpen: false })),
    mentionFile,
  };
}

function createComposeActions(ctx: ComposeActionCtx) {
  const { stateRef, setState, sendMessage, requestFocusRef } = ctx;
  const get = (): ComposeState => stateRef.current;

  const submit = () => {
    const { value: v, attachedFiles: files } = get();
    const trimmed = v.trim();
    if (!trimmed) return;
    if (files.length === 0) {
      setState((prev) => ({ ...prev, value: '', slashOpen: false }));
      sendMessage(trimmed);
      return;
    }
    void Promise.all(
      files.map(async (f) => {
        const data = await toBase64(f);
        return `[Attachment: ${f.name}]\n${data}`;
      }),
    ).then((parts) => {
      sendMessage(`${trimmed}\n\n${parts.join('\n\n')}`);
      setState((prev) => ({ ...prev, value: '', slashOpen: false, attachedFiles: [] }));
    });
  };

  const updateValue = (newValue: string, newCursorPos?: number) => {
    const pos = newCursorPos ?? newValue.length;
    setState((prev) => ({
      ...prev,
      value: newValue,
      cursorPos: pos,
      slashOpen: getSlashQuery(newValue, pos) !== null,
    }));
  };

  return {
    submit,
    focusTextarea: () => requestFocusRef.current?.(),
    updateValue,
    setCursorPos: (pos: number) => setState((prev) => ({ ...prev, cursorPos: pos })),
    addAttachments: (files: File[]) =>
      setState((prev) => ({ ...prev, attachedFiles: [...prev.attachedFiles, ...files] })),
    removeAttachment: (index: number) =>
      setState((prev) => ({
        ...prev,
        attachedFiles: prev.attachedFiles.filter((_, i) => i !== index),
      })),
    ...createSlashActions(ctx, get),
    ...createMentionActions(ctx, get),
  };
}

const initialComposeState: ComposeState = {
  value: '',
  cursorPos: 0,
  slashOpen: false,
  mentionOpen: false,
  attachedFiles: [],
};

export function ChannelComposeProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const channelId = useChannelId();
  const { sendMessage } = useChannelMessagesActions();
  const registry = useFeatureRegistry();
  const [state, setState] = useState<ComposeState>(initialComposeState);
  const stateRef = useRef(state);
  useLayoutEffect(() => {
    stateRef.current = state;
  });
  const router = useChannelSocketRouter();

  // ── Auto-wiring: handler map events ──
  useEffect(() => {
    if (!channelId) return;
    return router.register(composeHandlers, (fn) => setState(fn));
  }, [channelId, router]);

  const { value, cursorPos, slashOpen, mentionOpen, attachedFiles } = state;

  const slashToken = slashOpen ? getSlashQuery(value, cursorPos) : null;

  const slashFilter = slashOpen ? (slashToken?.query ?? '') : null;
  const hasText = value.trim().length > 0;
  const hasTextBeforeSlash = slashToken
    ? value.slice(0, slashToken.start).trim().length > 0
    : false;

  const requestFocusRef = useRef<((pos?: number) => void) | null>(null);
  const mentionTriggerRef = useRef<((value: string, pos: number) => void) | null>(null);

  const [actionsValue] = useState<ComposeActionsValue>(() => {
    const block = createComposeActions({
      stateRef,
      setState,
      sendMessage,
      requestFocusRef,
      mentionTriggerRef,
      registry,
    });
    return {
      ...block,
      registerFocus: (fn: (pos?: number) => void) => {
        requestFocusRef.current = fn;
      },
      registerMentionTrigger: (fn: (value: string, pos: number) => void) => {
        mentionTriggerRef.current = fn;
      },
    };
  });

  const stateValue: ComposeStateValue = {
    value,
    hasText,
    cursorPos,
    slashOpen,
    mentionOpen,
    slashFilter,
    hasTextBeforeSlash,
    attachedFiles,
  };

  return (
    <ComposeActionsContext.Provider value={actionsValue}>
      <ComposeStateContext.Provider value={stateValue}>{children}</ComposeStateContext.Provider>
    </ComposeActionsContext.Provider>
  );
}
