import { type RefObject, useRef } from 'react';

const CHAT_COLUMN_SELECTOR = '[data-chat-column]';

export function useChatColumnAnchorRef(
  sourceRef: RefObject<Element | null>,
): RefObject<{ getBoundingClientRect: () => DOMRect }> {
  return useRef({
    getBoundingClientRect: () =>
      sourceRef.current?.closest<HTMLElement>(CHAT_COLUMN_SELECTOR)?.getBoundingClientRect() ??
      new DOMRect(),
  });
}
