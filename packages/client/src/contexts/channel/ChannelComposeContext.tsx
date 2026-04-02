import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { toBase64 } from '../../utils/file';
import { getSlashQuery } from '../../utils/slash-query';
import { useSocket } from '../SocketContext';
import { useChannelMessagesActions } from './ChannelMessagesContext';
import { wireHandlers } from './handlers/guard';
import { composeHandlers } from './handlers/speech';

export interface ChannelComposeContextValue {
  value: string;
  hasText: boolean;
  cursorPos: number;
  setCursorPos: (pos: number) => void;
  registerFocus: (fn: (pos?: number) => void) => void;
  focusTextarea: () => void;
  slashOpen: boolean;
  updateValue: (newValue: string, cursorPos?: number) => void;
  submit: () => void;
  slashFilter: string | null;
  hasTextBeforeSlash: boolean;
  closeSlash: () => void;
  insertSlashCommand: (text: string) => void;
  executeSlashCommand: (cmd: string) => void;
  mentionFile: () => void;
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
  attachedFiles: File[];
}

const initialComposeState: ComposeState = {
  value: '',
  cursorPos: 0,
  slashOpen: false,
  attachedFiles: [],
};

export function ChannelComposeProvider({
  channelId,
  children,
}: {
  channelId: string;
  children: ReactNode;
}) {
  const { sendMessage } = useChannelMessagesActions();
  const { socket } = useSocket();
  const [state, setState] = useState<ComposeState>(initialComposeState);
  const stateRef = useRef(state);
  useLayoutEffect(() => {
    stateRef.current = state;
  });
  // ── Auto-wiring: handler map events ──
  useEffect(() => {
    if (!channelId) return;
    return wireHandlers(socket, channelId, composeHandlers, setState);
  }, [channelId, socket]);

  const { value, cursorPos, slashOpen, attachedFiles } = state;

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

  const actionsBlock = (() => {
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
      const { value: v, cursorPos: pos } = get();
      const token = getSlashQuery(v, pos);
      if (token) {
        const newValue = v.slice(0, token.start) + v.slice(token.end);
        setState((prev) => ({
          ...prev,
          value: newValue.trimEnd() === '' ? '' : newValue,
          slashOpen: false,
        }));
      } else {
        setState((prev) => ({ ...prev, value: '', slashOpen: false }));
      }
    };

    const closeSlash = clearSlashToken;

    const mentionFile = () => {
      const { value: v, cursorPos: pos } = get();
      setState((prev) => ({ ...prev, value: `${v.slice(0, pos)}@${v.slice(pos)}` }));
      requestFocusRef.current?.(pos + 1);
    };

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
      sendMessage(cmd);
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
      mentionFile,
      focusTextarea,
      updateValue,
      setCursorPos,
      insertSlashCommand,
      executeSlashCommand,
      addAttachments,
      removeAttachment,
    };
  })();

  return (
    <ComposeActionsContext.Provider value={{ registerFocus, ...actionsBlock }}>
      <ComposeStateContext.Provider
        value={{
          value,
          hasText,
          cursorPos,
          slashOpen,
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
