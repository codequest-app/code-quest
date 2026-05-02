import { useMemo, useState } from 'react';
import type { ForkFn, RewindFn } from '@/types/ui';
import { cn } from '@/utils/cn';
import type { MessageNode } from '@/utils/message-tree';
import { buildGroupChips, splitTimelineRuns, type TimelineRun } from '@/utils/tool-utils';
import { ChatMessage } from './ChatMessage.tsx';
import { SubagentChildren } from './SubagentChildren.tsx';
import { ToolGroupSummary } from './ToolGroupSummary.tsx';

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

function dotClass(node: MessageNode): string {
  if (
    node.message.type === 'text' ||
    node.message.type === 'thinking' ||
    node.message.type === 'streamlined_text'
  ) {
    return 'bg-text-muted/60';
  }
  const result = node.message.type === 'tool_use' ? node.message.meta.result : undefined;
  if (result?.is_error) return 'bg-danger';
  if (result) return 'bg-success';
  return 'bg-accent animate-pulse';
}

const LINE_CLASS: Record<RowPosition, string> = {
  only: 'hidden',
  first: 'top-4 bottom-0',
  last: 'top-0 h-4',
  middle: 'top-0 bottom-0',
};

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
  const lineClass = LINE_CLASS[position];
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
          model={node.message.type === 'tool_use' ? node.message.meta.model : undefined}
        />
      )}
    </div>
  );
}

function ToolGroup({
  nodes,
  onRewind,
  onFork,
  onStopTask,
  onDiffRespond,
}: RunProps & { nodes: MessageNode[] }) {
  const [expanded, setExpanded] = useState(false);
  const chips = useMemo(() => buildGroupChips(nodes), [nodes]);
  const collapsedIds = useMemo(() => nodes.map((n) => n.message.id).join(','), [nodes]);

  return (
    <div data-collapsed-ids={collapsedIds}>
      <ToolGroupSummary chips={chips} expanded={expanded} onToggle={() => setExpanded((v) => !v)} />
      {expanded &&
        nodes.map((node, i) => (
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

function RunItem({
  run,
  position,
  onRewind,
  onFork,
  onStopTask,
  onDiffRespond,
}: RunProps & { run: TimelineRun; position: RowPosition }): React.JSX.Element {
  if (run.kind === 'grouped') {
    return (
      <ToolGroup
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
      node={run.node}
      position={position}
      onRewind={onRewind}
      onFork={onFork}
      onStopTask={onStopTask}
      onDiffRespond={onDiffRespond}
    />
  );
}

export function CollapsibleTimeline({
  nodes,
  onRewind,
  onFork,
  onStopTask,
  onDiffRespond,
}: RunProps & { nodes: MessageNode[] }): React.JSX.Element {
  const runs = useMemo(() => splitTimelineRuns(nodes), [nodes]);
  return (
    <div className="animate-fade-in mt-1">
      {runs.map((run, i) => (
        <RunItem
          key={run.kind === 'grouped' ? run.nodes[0]?.message.id : run.node.message.id}
          run={run}
          position={positionOf(i, runs.length)}
          onRewind={onRewind}
          onFork={onFork}
          onStopTask={onStopTask}
          onDiffRespond={onDiffRespond}
        />
      ))}
    </div>
  );
}
