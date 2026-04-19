import type { RefObject } from 'react';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useChannelControl, useChannelMessages, useMessageVisibility } from '../contexts/channel';
import { filterTree } from '../utils/filter-tree';
import { isMessageVisible } from '../utils/isMessageVisible';
import { buildMessageTree } from '../utils/message-tree';
import { MessageNodeList } from './MessageNodeList';
import { SpinnerVerb } from './SpinnerVerb';

const SCROLL_THRESHOLD_PX = 50;

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
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);
    const isAtBottomRef = useRef(true);
    const programmaticScrollRef = useRef(false);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const registeredCountRef = useRef(0);

    const handleScroll = (e?: React.UIEvent<HTMLElement>) => {
      if (programmaticScrollRef.current) return;
      const el = (e?.currentTarget ?? scrollContainerRef.current) as HTMLElement | null;
      if (!el) return;
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < SCROLL_THRESHOLD_PX;
      isAtBottomRef.current = atBottom;
      if (showScrollButton === atBottom) setShowScrollButton(!atBottom);
    };

    const lastContentLen = messages.length > 0 ? messages[messages.length - 1].content.length : 0;
    const prevScrollRef = useRef({ count: messages.length, contentLen: lastContentLen });
    useEffect(() => {
      const countChanged = messages.length !== prevScrollRef.current.count;
      const contentGrew = lastContentLen !== prevScrollRef.current.contentLen;
      prevScrollRef.current = { count: messages.length, contentLen: lastContentLen };
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
        const container = scrollContainerRef.current;
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
    const fullTree = buildMessageTree(messages);
    const visibleTree = filterTree(
      fullTree,
      (m) => isMessageVisible(m, enabledTypes) || unknownTypes.has(m.type),
    );
    const tree = q
      ? filterTree(visibleTree, (m) => m.content.toLowerCase().includes(q))
      : visibleTree;

    return (
      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden"
        data-testid="message-list"
        onScroll={handleScroll}
      >
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="absolute inset-0 overflow-y-auto overflow-x-hidden"
          data-testid="message-list-scroll"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center select-none gap-3 relative -top-7">
              <span className="text-4xl text-assistant">✦</span>
              <span className="text-lg font-medium text-text-bright">CC Office</span>
              <span className="text-sm text-text-muted">How can I help you today?</span>
            </div>
          ) : (
            <div data-testid="message-content-wrapper" className="px-4 pt-5 pb-32">
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
            </div>
          )}
        </div>
        {showScrollButton && (
          <button
            type="button"
            aria-label="Scroll to bottom"
            data-testid="scroll-to-bottom"
            onClick={scrollToBottom}
            className="absolute bottom-4 right-4 z-float w-8 h-8 rounded-full bg-surface-hover text-text-muted hover:text-text flex items-center justify-center shadow-lg cursor-pointer transition-colors"
          >
            ↓
          </button>
        )}
      </div>
    );
  },
);
MessageList.displayName = 'MessageList';
