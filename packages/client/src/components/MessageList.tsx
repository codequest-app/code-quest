import type { MutableRefObject } from 'react';
import { useEffect, useMemo, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { useChannelControl, useChannelMessages } from '../contexts/channel';
import { buildMessageTree } from '../utils/message-tree';
import { MessageNodeList } from './MessageNodeList';
import { SpinnerVerb } from './SpinnerVerb';

function smoothScroll(
  scrollRef: MutableRefObject<HTMLDivElement | null>,
  programmaticScrollRef: MutableRefObject<boolean>,
) {
  programmaticScrollRef.current = true;
  scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => {
    programmaticScrollRef.current = false;
  }, 500);
}

export function MessageList({
  searchQuery = '',
  typeFilter = [],
}: {
  searchQuery?: string;
  typeFilter?: string[];
}) {
  const {
    messages,
    isProcessing,
    statusText,
    rewindToMessage: onRewind,
    forkSession: onFork,
  } = useChannelMessages();
  const { stopTask: onStopTask, diffRespond: onDiffRespond } = useChannelControl();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isAtBottomRef = useRef(true);
  const programmaticScrollRef = useRef(false);
  const { ref: bottomRef, inView } = useInView({ threshold: 0 });
  const showScrollButton = !inView;

  const mergedBottomRef = (el: HTMLDivElement | null) => {
    bottomRef(el);
    scrollRef.current = el;
  };

  const handleScroll = () => {
    if (programmaticScrollRef.current) return;
    const el = containerRef.current;
    if (!el) return;
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
  };

  const messageCountRef = useRef(messages.length);
  const hasPending = messages.some((m) => m.type === 'pending_action');
  useEffect(() => {
    const prevCount = messageCountRef.current;
    messageCountRef.current = messages.length;
    if (messages.length === prevCount) return;
    if (isAtBottomRef.current || hasPending) {
      smoothScroll(scrollRef, programmaticScrollRef);
    }
  }, [messages.length, hasPending]);

  const scrollToBottom = () => {
    isAtBottomRef.current = true;
    smoothScroll(scrollRef, programmaticScrollRef);
  };

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return messages
      .filter((m) => typeFilter.length === 0 || !typeFilter.includes(m.type))
      .filter((m) => !q || m.content.toLowerCase().includes(q));
  }, [messages, searchQuery, typeFilter]);

  const tree = useMemo(() => buildMessageTree(filtered), [filtered]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="relative flex-1 overflow-y-auto scrollbar-thin"
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
          <div ref={mergedBottomRef} data-testid="message-list-bottom" />
          {/* Bottom gradient fade overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-[150px] bg-gradient-to-b from-transparent to-bg pointer-events-none z-[2]" />
        </div>
      )}
      {showScrollButton && (
        <button
          type="button"
          aria-label="Scroll to bottom"
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-surface-hover text-text-muted hover:text-text flex items-center justify-center shadow-lg cursor-pointer transition-colors"
        >
          ↓
        </button>
      )}
    </div>
  );
}
