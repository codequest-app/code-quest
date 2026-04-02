import type { RefObject } from 'react';
import type { ChannelState } from '../../../types/chat';
import { msg } from '../../../utils/message';

type SetChannelState = (fn: (prev: ChannelState) => ChannelState) => void;

export function streamingRemovePlaceholder(setState: SetChannelState): void {
  setState((prev) => {
    if (
      prev.messages.length > 0 &&
      prev.messages[prev.messages.length - 1].type === 'content_block_start'
    ) {
      return { ...prev, messages: prev.messages.slice(0, -1) };
    }
    return prev;
  });
}

export function streamingAppendToLast(setState: SetChannelState, content: string): void {
  setState((prev) => {
    if (prev.messages.length === 0) return prev;
    const msgs = [...prev.messages];
    msgs[msgs.length - 1] = {
      ...msgs[msgs.length - 1],
      content: msgs[msgs.length - 1].content + content,
    };
    return { ...prev, messages: msgs };
  });
}

export function streamingAppendOrCreate(
  setState: SetChannelState,
  isTextStreaming: RefObject<boolean>,
  removePlaceholder: () => void,
  content: string,
  parentToolUseId?: string,
): void {
  removePlaceholder();
  if (isTextStreaming.current) {
    streamingAppendToLast(setState, content);
  } else {
    isTextStreaming.current = true;
    setState((prev) => ({
      ...prev,
      messages: [
        ...prev.messages,
        msg({ role: 'assistant', type: 'text', content, parentToolUseId }),
      ],
    }));
  }
}
