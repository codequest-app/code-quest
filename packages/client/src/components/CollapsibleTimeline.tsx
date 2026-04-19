import { useState } from 'react';
import type { ForkFn, RewindFn } from '../types/ui';
import { cn } from '../utils/cn';
import type { MessageNode } from '../utils/message-tree';
import { splitTimelineRuns, type TimelineRun } from '../utils/tool-group-rules';
import { ChatMessage } from './ChatMessage';
import { RotatableChevron } from './message-blocks/shared';
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
  return 'bg-accent animate-pulse';
}

interface RunProps {
  onRewind?: RewindFn;
  onFork?: ForkFn;
  onStopTask?: (taskId: string) => void;
  onDiffRespond?: (toolId: string, accepted: boolean) => void;
}

type RowPosition = 'first' | 'last' | 'middle' | 'only';

function positionOf(index: number, total: number): RowPosition {
  if (total === 1) return 'only';
  if (index === 0) return 'first';
  if (index === total - 1) return 'last';
  return 'middle';
}

function TimelineRow({
  node,
  position,
  onRewind,
  onFork,
  onStopTask,
  onDiffRespond,
}: RunProps & {
  node: MessageNode;
  position: RowPosition;
}) {
  const lineClass =
    position === 'only'
      ? 'hidden'
      : position === 'first'
        ? 'top-4 bottom-0'
        : position === 'last'
          ? 'top-0 h-4'
          : 'top-0 bottom-0';
  return (
    <div data-message-id={node.message.id} className="relative pl-7 py-2">
      <span className={cn('absolute left-2 top-4 w-2 h-2 rounded-full z-sticky', dotClass(node))} />
      <span className={cn('absolute left-3 w-px bg-border', lineClass)} />
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
          parentToolId={node.message.type === 'tool_use' ? node.message.meta.toolId : undefined}
        />
      )}
    </div>
  );
}

function ExploredGroup({
  nodes,
  onRewind,
  onFork,
  onStopTask,
  onDiffRespond,
}: RunProps & { nodes: MessageNode[] }) {
  const [expanded, setExpanded] = useState(false);
  const hasError = nodes.some((n) => getToolResult(n)?.is_error);

  if (!expanded) {
    const dot = hasError ? 'bg-danger' : 'bg-success';
    return (
      <div data-collapsed-ids={nodes.map((n) => n.message.id).join(',')}>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex items-center gap-2 pl-7 py-2 text-xs text-text-muted hover:text-text cursor-pointer select-none transition-colors"
        >
          <span className={cn('w-2 h-2 rounded-full', dot)} />
          <span className="font-medium">Explored</span>
          <span className="bg-white/10 rounded-full px-1.5 py-0.5 text-xs">{nodes.length}</span>
          <RotatableChevron className="text-xs opacity-50" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded(false)}
        className="flex items-center gap-2 pl-7 py-1 text-xs text-text-muted hover:text-text cursor-pointer select-none transition-colors"
      >
        <RotatableChevron open className="text-xs opacity-50" />
        <span>Collapse</span>
      </button>
      {nodes.map((node, i) => (
        <TimelineRow
          key={node.message.id}
          node={node}
          position={positionOf(i, nodes.length)}
          onRewind={onRewind}
          onFork={onFork}
          onStopTask={onStopTask}
          onDiffRespond={onDiffRespond}
        />
      ))}
    </div>
  );
}

export function CollapsibleTimeline({
  nodes,
  onRewind,
  onFork,
  onStopTask,
  onDiffRespond,
}: RunProps & { nodes: MessageNode[] }) {
  const runs: TimelineRun[] = splitTimelineRuns(nodes);
  return (
    <div className="animate-fade-in mt-1">
      {runs.map((run, i) => {
        if (run.kind === 'grouped') {
          return (
            <ExploredGroup
              key={run.nodes[0].message.id}
              nodes={run.nodes}
              onRewind={onRewind}
              onFork={onFork}
              onStopTask={onStopTask}
              onDiffRespond={onDiffRespond}
            />
          );
        }
        return (
          <TimelineRow
            key={run.node.message.id}
            node={run.node}
            position={positionOf(i, runs.length)}
            onRewind={onRewind}
            onFork={onFork}
            onStopTask={onStopTask}
            onDiffRespond={onDiffRespond}
          />
        );
      })}
    </div>
  );
}
