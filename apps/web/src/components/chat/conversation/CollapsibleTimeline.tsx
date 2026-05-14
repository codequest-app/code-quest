import { useMemo, useState } from 'react';
import { useChannelStore } from '@/stores/ChannelStoreContext';
import type { AssistantTurn, ForkFn, Message, RewindFn } from '@/types/ui';
import { getToolId } from '@/utils/message-helpers';
import { buildGroupChips, splitTimelineRuns, type TimelineRun } from '@/utils/timeline-utils';
import { NodeContent } from './NodeContent.tsx';
import { type RowPosition, TimelineItem } from './TimelineItem.tsx';
import { ToolGroupSummary } from './ToolGroupSummary.tsx';

interface RunProps {
  lastTurnId?: string;
  childrenIndex?: Map<string, Message[]>;
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

function dotClass(
  message: Message,
  storeResult?: { content?: string; is_error?: boolean },
): string {
  if (
    message.type === 'text' ||
    message.type === 'thinking' ||
    message.type === 'streamlined_text'
  ) {
    return 'bg-muted/60';
  }
  if (message.type === 'assistant_turn') {
    const turn = message as AssistantTurn;
    const hasToolUse = turn.blocks.some((b) => b.type === 'tool_use');
    if (!hasToolUse) return 'bg-muted/60';
  }
  if (storeResult?.is_error) return 'bg-danger';
  if (storeResult) return 'bg-success';
  return 'bg-accent animate-pulse';
}

function TimelineRow({
  message,
  position,
  lastTurnId,
  childrenIndex,
  onRewind,
  onFork,
  onStopTask,
  onDiffRespond,
}: RunProps & {
  message: Message;
  position: RowPosition;
}) {
  const toolId = getToolId(message);
  const storeResult = useChannelStore((s) => (toolId ? s.results.get(toolId) : undefined));
  return (
    <TimelineItem
      position={position}
      dotClass={dotClass(message, storeResult)}
      data-message-id={message.id}
    >
      <NodeContent
        message={message}
        childrenIndex={childrenIndex}
        showAvatar={false}
        isLastTurn={message.type === 'assistant_turn' && message.id === lastTurnId}
        onRewind={onRewind}
        onFork={onFork}
        onStopTask={onStopTask}
        onDiffRespond={onDiffRespond}
      />
    </TimelineItem>
  );
}

function ToolGroup({
  messages,
  position,
  lastTurnId,
  childrenIndex,
  onRewind,
  onFork,
  onStopTask,
  onDiffRespond,
}: RunProps & { messages: Message[]; position: RowPosition }) {
  const [expanded, setExpanded] = useState(false);
  const chips = useMemo(() => buildGroupChips(messages), [messages]);
  const collapsedIds = useMemo(() => messages.map((m) => m.id).join(','), [messages]);

  return (
    <div data-collapsed-ids={collapsedIds}>
      <TimelineItem
        position={expanded ? 'first' : position}
        dotClass="bg-muted/40"
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
        messages.map((msg, i) => {
          const rowPosition = i === messages.length - 1 ? position : positionOf(i, messages.length);
          return (
            <TimelineRow
              key={msg.id}
              message={msg}
              position={rowPosition}
              lastTurnId={lastTurnId}
              childrenIndex={childrenIndex}
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
  lastTurnId,
  childrenIndex,
  onRewind,
  onFork,
  onStopTask,
  onDiffRespond,
}: RunProps & { run: TimelineRun; position: RowPosition }): React.JSX.Element {
  if (run.kind === 'grouped') {
    return (
      <ToolGroup
        messages={run.messages}
        position={position}
        lastTurnId={lastTurnId}
        childrenIndex={childrenIndex}
        onRewind={onRewind}
        onFork={onFork}
        onStopTask={onStopTask}
        onDiffRespond={onDiffRespond}
      />
    );
  }
  return (
    <TimelineRow
      message={run.message}
      position={position}
      lastTurnId={lastTurnId}
      childrenIndex={childrenIndex}
      onRewind={onRewind}
      onFork={onFork}
      onStopTask={onStopTask}
      onDiffRespond={onDiffRespond}
    />
  );
}

export function CollapsibleTimeline({
  messages,
  lastTurnId,
  childrenIndex,
  onRewind,
  onFork,
  onStopTask,
  onDiffRespond,
}: RunProps & { messages: Message[] }): React.JSX.Element {
  const runs = useMemo(() => splitTimelineRuns(messages), [messages]);
  return (
    <div className="animate-fade-in mt-1">
      {runs.map((run, i) => (
        <RunItem
          key={run.kind === 'grouped' ? run.messages[0]?.id : run.message.id}
          run={run}
          position={positionOf(i, runs.length)}
          lastTurnId={lastTurnId}
          childrenIndex={childrenIndex}
          onRewind={onRewind}
          onFork={onFork}
          onStopTask={onStopTask}
          onDiffRespond={onDiffRespond}
        />
      ))}
    </div>
  );
}
