import { useMemo, useState } from 'react';
import type { ForkFn, RewindFn } from '@/types/ui';
import type { MessageNode } from '@/utils/message-tree';
import { buildGroupChips, splitTimelineRuns, type TimelineRun } from '@/utils/tool-utils';
import { ChatMessage } from './ChatMessage.tsx';
import { SubagentChildren } from './SubagentChildren.tsx';
import { type RowPosition, TimelineItem } from './TimelineItem.tsx';
import { ToolGroupSummary } from './ToolGroupSummary.tsx';

interface RunProps {
  onRewind?: RewindFn;
  onFork?: ForkFn;
  onStopTask?: (taskId: string) => void;
  onDiffRespond?: (toolId: string, accepted: boolean) => void;
}

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
  return (
    <TimelineItem position={position} dotClass={dotClass(node)} data-message-id={node.message.id}>
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
    </TimelineItem>
  );
}

function ToolGroup({
  nodes,
  position,
  onRewind,
  onFork,
  onStopTask,
  onDiffRespond,
}: RunProps & { nodes: MessageNode[]; position: RowPosition }) {
  const [expanded, setExpanded] = useState(false);
  const chips = useMemo(() => buildGroupChips(nodes), [nodes]);
  const collapsedIds = useMemo(() => nodes.map((n) => n.message.id).join(','), [nodes]);

  return (
    <div data-collapsed-ids={collapsedIds}>
      <TimelineItem
        position={expanded ? 'first' : position}
        dotClass="bg-text-muted/40"
        showDot={!expanded}
        py="py-1.5"
      >
        <ToolGroupSummary
          chips={chips}
          expanded={expanded}
          onToggle={() => setExpanded((v) => !v)}
        />
      </TimelineItem>
      {expanded &&
        nodes.map((node, i) => {
          const rowPosition = i === nodes.length - 1 ? position : positionOf(i, nodes.length);
          return (
            <TimelineRow
              key={node.message.id}
              node={node}
              position={rowPosition}
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
        position={position}
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
