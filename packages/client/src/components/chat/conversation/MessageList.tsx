import { useVirtualizer, type VirtualItem, type Virtualizer } from '@tanstack/react-virtual';
import {
  forwardRef,
  type RefObject,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  useChannelControl,
  useChannelMessages,
  useMessageVisibility,
} from '../../../contexts/channel';
import type { ForkFn, RewindFn } from '../../../types/ui';
import { filterTree } from '../../../utils/filter-tree';
import { groupForTimeline } from '../../../utils/group-for-timeline';
import { isMessageVisible } from '../../../utils/isMessageVisible';
import { buildMessageTree, type MessageNode } from '../../../utils/message-tree';
import { SpinnerVerb } from '../SpinnerVerb';
import { ChatMessage } from './ChatMessage';
import { CollapsibleTimeline } from './CollapsibleTimeline';
import { SubagentChildren } from './SubagentChildren';

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

function collectIds(node: MessageNode, topIndex: number, map: Map<string, number>) {
  map.set(node.message.id, topIndex);
  for (const child of node.children) collectIds(child, topIndex, map);
}

function groupKey(group: ReturnType<typeof groupForTimeline>[number]): string {
  return group.kind === 'timeline'
    ? (group.nodes[0]?.message.id ?? 'timeline')
    : group.node.message.id;
}

type DisplayGroup = ReturnType<typeof groupForTimeline>[number];

function VirtualGroupItem({
  group,
  item,
  virtualizer,
  onRewind,
  onFork,
  onStopTask,
  onDiffRespond,
}: {
  group: DisplayGroup;
  item: VirtualItem;
  virtualizer: Pick<Virtualizer<HTMLDivElement, HTMLDivElement>, 'measureElement'>;
  onRewind?: RewindFn;
  onFork?: ForkFn;
  onStopTask?: (taskId: string) => void;
  onDiffRespond?: (toolId: string, accepted: boolean) => void;
}): React.JSX.Element {
  return (
    <div
      data-index={item.index}
      ref={virtualizer.measureElement}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        transform: `translateY(${item.start}px)`,
      }}
    >
      {group.kind === 'timeline' ? (
        <CollapsibleTimeline
          nodes={group.nodes}
          onRewind={onRewind}
          onFork={onFork}
          onStopTask={onStopTask}
          onDiffRespond={onDiffRespond}
        />
      ) : (
        <div data-message-id={group.node.message.id} className="animate-fade-in py-2">
          <ChatMessage
            message={group.node.message}
            showAvatar={group.node.message.role !== group.prevRole}
            onRewind={onRewind}
            onFork={onFork}
            onDiffRespond={onDiffRespond}
          />
          {group.node.children.length > 0 && (
            <SubagentChildren
              nodes={group.node.children}
              onStopTask={onStopTask}
              onDiffRespond={onDiffRespond}
              parentToolId={
                group.node.message.type === 'tool_use' ? group.node.message.meta.toolId : undefined
              }
            />
          )}
        </div>
      )}
    </div>
  );
}

export const MessageList: React.ForwardRefExoticComponent<
  { searchQuery?: string } & React.RefAttributes<MessageListHandle>
> = forwardRef<MessageListHandle, { searchQuery?: string }>(function MessageList(
  { searchQuery = '' },
  ref,
) {
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

  const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
  const lastContentLen = lastMsg?.content.length ?? 0;
  const lastRole = lastMsg?.role ?? null;
  const prevScrollRef = useRef({ count: messages.length, contentLen: lastContentLen });
  useEffect(() => {
    const countChanged = messages.length !== prevScrollRef.current.count;
    const contentGrew = lastContentLen !== prevScrollRef.current.contentLen;
    prevScrollRef.current = { count: messages.length, contentLen: lastContentLen };
    if (!countChanged && !contentGrew) return;
    // A new user message means the user just submitted — always pull the
    // view back to the bottom, even if they had scrolled up while reading.
    if (countChanged && lastRole === 'user') {
      isAtBottomRef.current = true;
      scrollToEnd(scrollRef, programmaticScrollRef, 'smooth');
      return;
    }
    if (isAtBottomRef.current) {
      const behavior = countChanged ? 'smooth' : 'instant';
      scrollToEnd(scrollRef, programmaticScrollRef, behavior);
    }
  }, [messages.length, lastContentLen, lastRole]);

  const scrollToBottom = () => {
    isAtBottomRef.current = true;
    scrollToEnd(scrollRef, programmaticScrollRef, 'instant');
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: React Compiler stabilizes registerUnknownType
  useEffect(() => {
    const newMessages = messages.slice(registeredCountRef.current);
    for (const m of newMessages) registerUnknownType(m.type);
    registeredCountRef.current = messages.length;
  }, [messages]);

  const q = searchQuery.toLowerCase();
  const visibleTree = useMemo(() => {
    const fullTree = buildMessageTree(messages);
    return filterTree(
      fullTree,
      (m) => isMessageVisible(m, enabledTypes) || unknownTypes.has(m.type),
    );
  }, [messages, enabledTypes, unknownTypes]);
  const tree = useMemo(
    () => (q ? filterTree(visibleTree, (m) => m.content.toLowerCase().includes(q)) : visibleTree),
    [visibleTree, q],
  );

  const displayGroups = useMemo(() => groupForTimeline(tree, null), [tree]);

  const idToIndex = useMemo(() => {
    const map = new Map<string, number>();
    displayGroups.forEach((group, i) => {
      if (group.kind === 'timeline') {
        for (const node of group.nodes) collectIds(node, i, map);
      } else {
        collectIds(group.node, i, map);
      }
    });
    return map;
  }, [displayGroups]);

  const virtualizer = useVirtualizer({
    count: displayGroups.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 80,
    overscan: 5,
  });

  // Virtualizer's total size changes as items get measured, but that doesn't
  // fire scroll events. Re-sync stick-to-bottom and scroll-button visibility
  // whenever the measured total grows.
  const totalSize = virtualizer.getTotalSize();
  // biome-ignore lint/correctness/useExhaustiveDependencies: totalSize is the trigger; effect reads live scroll metrics via ref
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    if (isAtBottomRef.current) {
      el.scrollTop = el.scrollHeight;
      return;
    }
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < SCROLL_THRESHOLD_PX;
    setShowScrollButton(!atBottom);
  }, [totalSize]);

  useImperativeHandle(ref, () => ({
    scrollToMessage(id: string) {
      const container = scrollContainerRef.current;
      if (!container) return;

      const collapsed = container.querySelector(`[data-collapsed-ids*="${id}"]`);
      if (collapsed) {
        const expandBtn = collapsed.querySelector('button') as HTMLButtonElement | null;
        expandBtn?.click();
        requestAnimationFrame(() => this.scrollToMessage(id));
        return;
      }

      const scrollAndSpotlight = (el: Element) => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const bubble = (el.querySelector('[data-type]') ?? el) as HTMLElement;
        bubble.classList.remove('spotlight-highlight');
        void bubble.offsetHeight;
        bubble.classList.add('spotlight-highlight');
        bubble.addEventListener(
          'animationend',
          () => bubble.classList.remove('spotlight-highlight'),
          { once: true },
        );
      };

      const el = container.querySelector(`[data-message-id="${id}"]`);
      if (el) {
        scrollAndSpotlight(el);
        return;
      }

      const index = idToIndex.get(id);
      if (index === undefined) return;
      virtualizer.scrollToIndex(index, { align: 'center' });
      requestAnimationFrame(() => {
        const later = container.querySelector(`[data-message-id="${id}"]`);
        if (later) scrollAndSpotlight(later);
      });
    },
  }));

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <section
      className="relative flex-1 overflow-hidden"
      aria-label="message-list"
      onScroll={handleScroll}
    >
      <section
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="absolute inset-0 overflow-y-auto overflow-x-hidden"
        aria-label="message-list-scroll"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center select-none gap-3 relative -top-7">
            <span className="text-4xl text-assistant">✦</span>
            <span className="text-lg font-medium text-text-bright">CC Office</span>
            <span className="text-sm text-text-muted">How can I help you today?</span>
          </div>
        ) : (
          <section aria-label="message-content-wrapper" className="px-4 pt-5 pb-32">
            <div
              style={{
                height: totalSize,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualItems.map((item) => {
                const group = displayGroups[item.index];
                if (!group) return null;
                return (
                  <VirtualGroupItem
                    key={groupKey(group)}
                    group={group}
                    item={item}
                    virtualizer={virtualizer}
                    onRewind={onRewind}
                    onFork={onFork}
                    onStopTask={onStopTask}
                    onDiffRespond={onDiffRespond}
                  />
                );
              })}
            </div>
            {isProcessing && <SpinnerVerb statusText={statusText} />}
            <section ref={scrollRef} aria-label="message-list-bottom" />
          </section>
        )}
      </section>
      {showScrollButton && (
        <button
          type="button"
          aria-label="Scroll to bottom"
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 z-float w-8 h-8 rounded-full bg-surface-hover text-text-muted hover:text-text flex items-center justify-center shadow-lg cursor-pointer transition-colors"
        >
          ↓
        </button>
      )}
    </section>
  );
});
MessageList.displayName = 'MessageList';
