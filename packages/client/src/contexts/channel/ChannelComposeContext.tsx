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
import { createMentionFileFeature } from '../../features/mention-file/mention-file-feature';
import type { FeatureRegistry } from '../../lib/feature-registry';
import { getMentionQuery, getSlashQuery } from '../../utils/slash-query';
import { useSocket } from '../SocketContext';
import { useChannelId } from './ChannelIdContext';
import { useChannelMessagesActions } from './ChannelMessagesContext';
import { useFeatureRegistry } from './FeatureRegistryContext';
import { wireHandlers } from './handlers/guard';
import { composeHandlers } from './handlers/speech';

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

interface ComposeState {
  value: string;
  cursorPos: number;
  slashOpen: boolean;
  mentionOpen: boolean;
  attachedFiles: File[];
}

function createComposeActions(
  stateRef: { current: ComposeState },
  setState: Dispatch<SetStateAction<ComposeState>>,
  sendMessage: (text: string) => void,
  requestFocusRef: { current: ((pos?: number) => void) | null },
  mentionTriggerRef: { current: ((value: string, pos: number) => void) | null },
  registry: FeatureRegistry,
) {
  const get = () => stateRef.current;

  const submit = () => {
    const { value: v, attachedFiles: files } = get();
    const trimmed = v.trim();
    if (!trimmed) return;
    if (files.length > 0) {
      void Promise.all(
        files.map(async (f) => {
          const data = await toBase64(f);
          return `[Attachment: ${f.name}]\n${data}`;
        }),
      ).then((parts) => {
        sendMessage(`${trimmed}\n\n${parts.join('\n\n')}`);
        setState((prev) => ({ ...prev, attachedFiles: [] }));
      });
    } else {
      sendMessage(trimmed);
    }
    setState((prev) => ({ ...prev, value: '', slashOpen: false }));
  };

  const clearSlashToken = () => {
    setState((prev) => {
      const token = getSlashQuery(prev.value, prev.cursorPos);
      if (!token) return { ...prev, slashOpen: false };
      const newValue = prev.value.slice(0, token.start) + prev.value.slice(token.end);
      return { ...prev, value: newValue.trimEnd() === '' ? '' : newValue, slashOpen: false };
    });
  };

  const closeSlash = clearSlashToken;

  const dismissSlash = () => {
    setState((prev) => ({ ...prev, slashOpen: false }));
  };

  const openMention = () => setState((prev) => ({ ...prev, mentionOpen: true }));
  const closeMention = () => setState((prev) => ({ ...prev, mentionOpen: false }));

  const mentionFile = () => {
    const snap = get();
    const snapToken = getSlashQuery(snap.value, snap.cursorPos);

    // If cursor is already inside a mention (@…), just open without inserting a duplicate @
    if (!snapToken && getMentionQuery(snap.value, snap.cursorPos) !== null) {
      requestFocusRef.current?.(snap.cursorPos);
      mentionTriggerRef.current?.(snap.value, snap.cursorPos);
      setState((prev) => ({ ...prev, mentionOpen: true }));
      return;
    }

    const focusAt = snapToken ? snapToken.start + 1 : snap.cursorPos + 1;
    const triggeredValue = snapToken
      ? `${snap.value.slice(0, snapToken.start)}@${snap.value.slice(snapToken.end)}`
      : `${snap.value.slice(0, snap.cursorPos)}@${snap.value.slice(snap.cursorPos)}`;
    setState((prev) => {
      const token = getSlashQuery(prev.value, prev.cursorPos);
      if (token) {
        const newValue = `${prev.value.slice(0, token.start)}@${prev.value.slice(token.end)}`;
        return { ...prev, value: newValue, slashOpen: false, mentionOpen: true };
      }
      // Defensive: if already in a mention context, skip to avoid duplicate @
      if (getMentionQuery(prev.value, prev.cursorPos) !== null) {
        return { ...prev, slashOpen: false, mentionOpen: true };
      }
      const newValue = `${prev.value.slice(0, prev.cursorPos)}@${prev.value.slice(prev.cursorPos)}`;
      return { ...prev, value: newValue, mentionOpen: true };
    });
    requestFocusRef.current?.(focusAt);
    mentionTriggerRef.current?.(triggeredValue, focusAt);
  };

  registry.register(createMentionFileFeature({ mentionFile }));

  const focusTextarea = () => requestFocusRef.current?.();

  const updateValue = (newValue: string, newCursorPos?: number) => {
    const pos = newCursorPos ?? newValue.length;
    setState((prev) => ({
      ...prev,
      value: newValue,
      cursorPos: pos,
      slashOpen: getSlashQuery(newValue, pos) !== null,
    }));
  };

  const setCursorPos = (pos: number) => {
    setState((prev) => ({ ...prev, cursorPos: pos }));
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

  const addAttachments = (files: File[]) =>
    setState((prev) => ({ ...prev, attachedFiles: [...prev.attachedFiles, ...files] }));
  const removeAttachment = (index: number) =>
    setState((prev) => ({
      ...prev,
      attachedFiles: prev.attachedFiles.filter((_, i) => i !== index),
    }));

  return {
    submit,
    closeSlash,
    dismissSlash,
    openMention,
    closeMention,
    mentionFile,
    focusTextarea,
    updateValue,
    setCursorPos,
    insertSlashCommand,
    executeSlashCommand,
    addAttachments,
    removeAttachment,
  };
}

const initialComposeState: ComposeState = {
  value: '',
  cursorPos: 0,
  slashOpen: false,
  mentionOpen: false,
  attachedFiles: [],
};

export function ChannelComposeProvider({ children }: { children: ReactNode }) {
  const channelId = useChannelId();
  const { sendMessage } = useChannelMessagesActions();
  const { socket } = useSocket();
  const registry = useFeatureRegistry();
  const [state, setState] = useState<ComposeState>(initialComposeState);
  const stateRef = useRef(state);
  useLayoutEffect(() => {
    stateRef.current = state;
  });
  // ── Auto-wiring: handler map events ──
  useEffect(() => {
    if (!channelId) return;
    return wireHandlers(socket, channelId, composeHandlers, (fn) => setState(fn));
  }, [channelId, socket]);

  const { value, cursorPos, slashOpen, mentionOpen, attachedFiles } = state;

  const slashToken = slashOpen ? getSlashQuery(value, cursorPos) : null;

  const slashFilter = slashOpen ? (slashToken?.query ?? '') : null;
  const hasText = value.trim().length > 0;
  const hasTextBeforeSlash = slashToken
    ? value.slice(0, slashToken.start).trim().length > 0
    : false;

  const requestFocusRef = useRef<((pos?: number) => void) | null>(null);
  const registerFocus = (fn: (pos?: number) => void) => {
    requestFocusRef.current = fn;
  };

  const mentionTriggerRef = useRef<((value: string, pos: number) => void) | null>(null);
  const registerMentionTrigger = (fn: (value: string, pos: number) => void) => {
    mentionTriggerRef.current = fn;
  };

  const [actionsBlock] = useState(() =>
    createComposeActions(
      stateRef,
      setState,
      sendMessage,
      requestFocusRef,
      mentionTriggerRef,
      registry,
    ),
  );

  return (
    <ComposeActionsContext.Provider
      value={{ registerFocus, registerMentionTrigger, ...actionsBlock }}
    >
      <ComposeStateContext.Provider
        value={{
          value,
          hasText,
          cursorPos,
          slashOpen,
          mentionOpen,
          slashFilter,
          hasTextBeforeSlash,
          attachedFiles,
        }}
      >
        {children}
      </ComposeStateContext.Provider>
    </ComposeActionsContext.Provider>
  );
}
