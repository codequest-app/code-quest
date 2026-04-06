import { useEffect, useRef, useState } from 'react';
import type { ForkFn, RewindFn } from '../types/ui';
import type { MessageNode } from '../utils/message-tree';
import { ChatMessage } from './ChatMessage';
import { SubagentChildren } from './SubagentChildren';

function getToolResult(node: MessageNode) {
  return node.message.type === 'tool_use' ? node.message.meta.result : undefined;
}

function dotClass(node: MessageNode): string {
  if (
    node.message.type === 'text' ||
    node.message.type === 'thinking' ||
    node.message.type === 'streamlined_text'
  ) {
    return 'bg-text-muted/60';
  }
  const result = getToolResult(node);
  if (result?.is_error) return 'bg-danger';
  if (result) return 'bg-success';
  return 'bg-warning animate-pulse';
}

export function CollapsibleTimeline({
  nodes,
  onRewind,
  onFork,
  onStopTask,
  onDiffRespond,
}: {
  nodes: MessageNode[];
  onRewind?: RewindFn;
  onFork?: ForkFn;
  onStopTask?: (taskId: string) => void;
  onDiffRespond?: (toolId: string, accepted: boolean) => void;
}) {
  const allComplete = nodes.every((n) => getToolResult(n) != null);
  const hasError = nodes.some((n) => getToolResult(n)?.is_error);
  const toolCount = nodes.filter((n) => n.message.type === 'tool_use').length;
  const [expanded, setExpanded] = useState(true);
  const autoCollapsedRef = useRef(false);
  const prevAllCompleteRef = useRef(allComplete);

  useEffect(() => {
    const wasIncomplete = !prevAllCompleteRef.current;
    prevAllCompleteRef.current = allComplete;

    if (wasIncomplete && allComplete && toolCount >= 5 && !autoCollapsedRef.current) {
      autoCollapsedRef.current = true;
      setExpanded(false);
    }
  }, [allComplete, toolCount]);

  if (allComplete && !expanded) {
    const dot = hasError ? 'bg-danger' : 'bg-success';
    return (
      <div className="animate-fade-in mt-1">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex items-center gap-2 pl-[30px] py-2 text-xs text-text-muted hover:text-text cursor-pointer select-none transition-colors"
        >
          <span className={`w-[7px] h-[7px] rounded-full ${dot}`} />
          <span className="font-medium">Explored</span>
          <span className="bg-white/10 rounded-full px-1.5 py-0.5 text-[10px]">{nodes.length}</span>
          <span className="text-[10px] opacity-50">▶</span>
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in mt-1">
      {allComplete && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="flex items-center gap-2 pl-[30px] py-1 text-xs text-text-muted hover:text-text cursor-pointer select-none transition-colors"
        >
          <span className="text-[10px] opacity-50 rotate-90">▶</span>
          <span>Collapse</span>
        </button>
      )}
      {nodes.map((node, i) => {
        const isFirst = i === 0;
        const isLast = i === nodes.length - 1;
        const lineClass = isFirst
          ? 'top-[18px] bottom-0'
          : isLast
            ? 'top-0 h-[18px]'
            : 'top-0 bottom-0';
        return (
          <div key={node.message.id} className="relative pl-[30px] py-2">
            <span
              className={`absolute left-[9px] top-[15px] w-[7px] h-[7px] rounded-full z-10 ${dotClass(node)}`}
            />
            <span className={`absolute left-[12px] w-px bg-border ${lineClass}`} />
            <ChatMessage
              message={node.message}
              showAvatar={false}
              onRewind={onRewind}
              onFork={onFork}
              onDiffRespond={onDiffRespond}
            />
            {node.children.length > 0 && (
              <SubagentChildren
                nodes={node.children}
                onStopTask={onStopTask}
                onDiffRespond={onDiffRespond}
                parentToolId={
                  node.message.type === 'tool_use' ? node.message.meta.toolId : undefined
                }
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
