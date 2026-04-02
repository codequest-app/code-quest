import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toBase64 } from '../../utils/file';
import { getSlashQuery } from '../../utils/slash-query';
import { useSocket } from '../SocketContext';
import { composeHandlers } from '../handlers/channel/composeHandlers';
import { createGuard } from '../handlers/channel/guard';
import { useChannelMessages } from './ChannelMessagesContext';

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

const ChannelComposeContext = createContext<ChannelComposeContextValue | null>(null);

export function useChannelCompose(): ChannelComposeContextValue {
  const ctx = useContext(ChannelComposeContext);
  if (!ctx) throw new Error('useChannelCompose must be used within a ChannelComposeProvider');
  return ctx;
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

export function ChannelComposeProvider({ children }: { children: ReactNode }) {
  const { channelId, sendMessage } = useChannelMessages();
  const { socket } = useSocket();
  const [state, setState] = useState<ComposeState>(initialComposeState);
  const stateRef = useRef(state);
  stateRef.current = state;
  // ── Auto-wiring: handler map events ──
  useEffect(() => {
    if (!channelId) return;
    const guard = createGuard(channelId);
    const entries = Object.entries(composeHandlers) as Array<
      [string, (state: ComposeState, payload: never) => ComposeState]
    >;
    const wired = entries.map(([event, handler]) => {
      const fn = (payload: { channelId: string }) => {
        if (!guard(payload)) return;
        setState((prev) => handler(prev, payload as never));
      };
      socket.on(event as never, fn as never);
      return { event, fn };
    });
    return () => {
      for (const { event, fn } of wired) socket.off(event as never, fn as never);
    };
  }, [channelId, socket]);

  const { value, cursorPos, slashOpen, attachedFiles } = state;

  const slashToken = slashOpen ? getSlashQuery(value, cursorPos) : null;

  const slashFilter = slashOpen ? (slashToken?.query ?? '') : null;
  const hasText = value.trim().length > 0;
  const hasTextBeforeSlash = slashToken
    ? value.slice(0, slashToken.start).trim().length > 0
    : false;

  const requestFocusRef = useRef<((pos?: number) => void) | null>(null);
  const registerFocus = useCallback((fn: (pos?: number) => void) => {
    requestFocusRef.current = fn;
  }, []);

  const actions = useMemo(() => {
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

    const closeSlash = () => {
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
        setState((prev) => ({ ...prev, slashOpen: false }));
      }
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
  }, [sendMessage]);

  const contextValue = useMemo<ChannelComposeContextValue>(
    () => ({
      value,
      hasText,
      cursorPos,
      slashOpen,
      slashFilter,
      hasTextBeforeSlash,
      attachedFiles,
      registerFocus,
      ...actions,
    }),
    [
      value,
      hasText,
      cursorPos,
      slashOpen,
      slashFilter,
      hasTextBeforeSlash,
      attachedFiles,
      registerFocus,
      actions,
    ],
  );

  return (
    <ChannelComposeContext.Provider value={contextValue}>{children}</ChannelComposeContext.Provider>
  );
}
