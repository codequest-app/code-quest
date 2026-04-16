import type { RefObject } from 'react';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useChannelControl, useChannelMessages, useMessageVisibility } from '../contexts/channel';
import { isMessageVisible } from '../utils/isMessageVisible';
import { buildMessageTree } from '../utils/message-tree';
import { MessageNodeList } from './MessageNodeList';
import { SpinnerVerb } from './SpinnerVerb';

export interface MessageListHandle {
  scrollToMessage: (id: string) => void;
}

function scrollToEnd(
  scrollRef: RefObject<HTMLDivElement | null>,
  programmaticScrollRef: RefObject<boolean>,
  behavior: 'smooth' | 'instant' = 'smooth',
) {
  programmaticScrollRef.current = true;
  scrollRef.current?.scrollIntoView({ behavior });
  if (behavior === 'instant') {
    requestAnimationFrame(() => {
      programmaticScrollRef.current = false;
    });
  } else {
    setTimeout(() => {
      programmaticScrollRef.current = false;
    }, 500);
  }
}

export const MessageList = forwardRef<MessageListHandle, { searchQuery?: string }>(
  function MessageList({ searchQuery = '' }, ref) {
    const {
      messages,
      isProcessing,
      statusText,
      rewindToMessage: onRewind,
      forkSession: onFork,
    } = useChannelMessages();
    const { stopTask: onStopTask, diffRespond: onDiffRespond } = useChannelControl();
    const { enabledTypes, registerUnknownType, unknownTypes } = useMessageVisibility();
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const isAtBottomRef = useRef(true);
    const programmaticScrollRef = useRef(false);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const registeredCountRef = useRef(0);

    const handleScroll = () => {
      if (programmaticScrollRef.current) return;
      const el = containerRef.current;
      if (!el) return;
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
      isAtBottomRef.current = atBottom;
      if (showScrollButton === atBottom) setShowScrollButton(!atBottom);
    };

    const lastContentLen = messages.length > 0 ? messages[messages.length - 1].content.length : 0;
    const messageCountRef = useRef(messages.length);
    const lastContentLenRef = useRef(lastContentLen);
    useEffect(() => {
      const countChanged = messages.length !== messageCountRef.current;
      const contentGrew = lastContentLen !== lastContentLenRef.current;
      messageCountRef.current = messages.length;
      lastContentLenRef.current = lastContentLen;
      if (!countChanged && !contentGrew) return;
      if (isAtBottomRef.current) {
        const behavior = countChanged ? 'smooth' : 'instant';
        scrollToEnd(scrollRef, programmaticScrollRef, behavior);
      }
    }, [messages.length, lastContentLen]);

    const scrollToBottom = () => {
      isAtBottomRef.current = true;
      scrollToEnd(scrollRef, programmaticScrollRef, 'smooth');
    };

    useImperativeHandle(ref, () => ({
      scrollToMessage(id: string) {
        const container = containerRef.current;
        if (!container) return;

        // If the message is inside a collapsed timeline, expand it first
        const collapsed = container.querySelector(`[data-collapsed-ids*="${id}"]`);
        if (collapsed) {
          const expandBtn = collapsed.querySelector('button') as HTMLButtonElement | null;
          expandBtn?.click();
          // Wait one frame for the DOM to re-render, then scroll
          requestAnimationFrame(() => this.scrollToMessage(id));
          return;
        }

        const el = container.querySelector(`[data-message-id="${id}"]`);
        if (!el) return;

        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const bubble = (el.querySelector('[data-type]') ?? el) as HTMLElement;
        bubble.classList.remove('spotlight-highlight');
        void bubble.offsetHeight; // force reflow to restart animation
        bubble.classList.add('spotlight-highlight');
        bubble.addEventListener(
          'animationend',
          () => bubble.classList.remove('spotlight-highlight'),
          { once: true },
        );
      },
    }));

    // biome-ignore lint/correctness/useExhaustiveDependencies: React Compiler stabilizes registerUnknownType
    useEffect(() => {
      const newMessages = messages.slice(registeredCountRef.current);
      for (const m of newMessages) registerUnknownType(m.type);
      registeredCountRef.current = messages.length;
    }, [messages]);

    const q = searchQuery.toLowerCase();
    const visibleMessages = messages.filter(
      (m) => isMessageVisible(m, enabledTypes) || unknownTypes.has(m.type),
    );
    const filtered = q
      ? visibleMessages.filter((m) => m.content.toLowerCase().includes(q))
      : visibleMessages;

    const tree = buildMessageTree(filtered);

    return (
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="relative flex-1 overflow-y-auto"
        data-testid="message-list"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center select-none gap-3 relative -top-[30px]">
            <span className="text-4xl text-assistant">✦</span>
            <span className="text-lg font-medium text-text-bright">CC Office</span>
            <span className="text-sm text-text-muted">How can I help you today?</span>
          </div>
        ) : (
          <div className="relative px-5 pt-5 pb-[160px]">
            <MessageNodeList
              nodes={tree}
              prevRole={null}
              onRewind={onRewind}
              onFork={onFork}
              onStopTask={onStopTask}
              onDiffRespond={onDiffRespond}
            />
            {isProcessing && <SpinnerVerb statusText={statusText} />}
            <div ref={scrollRef} data-testid="message-list-bottom" />
            <div className="absolute bottom-0 left-0 right-0 h-[150px] bg-gradient-to-b from-transparent to-bg pointer-events-none z-[2]" />
          </div>
        )}
        {showScrollButton && (
          <button
            type="button"
            aria-label="Scroll to bottom"
            onClick={scrollToBottom}
            className="absolute bottom-4 right-4 z-30 w-8 h-8 rounded-full bg-surface-hover text-text-muted hover:text-text flex items-center justify-center shadow-lg cursor-pointer transition-colors"
          >
            ↓
          </button>
        )}
      </div>
    );
  },
);
MessageList.displayName = 'MessageList';
