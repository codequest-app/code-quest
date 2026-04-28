import type { ForkFn, RewindFn } from '../types/ui';
import { cn } from '../utils/cn';
import { groupForTimeline } from '../utils/group-for-timeline';
import type { MessageNode } from '../utils/message-tree';
import { ChatMessage } from './ChatMessage';
import { CollapsibleTimeline } from './CollapsibleTimeline';
import { SubagentChildren } from './SubagentChildren';

interface MessageNodeListProps {
  nodes: MessageNode[];
  prevRole: string | null;
  onRewind?: RewindFn;
  onFork?: ForkFn;
  onStopTask?: (taskId: string) => void;
  onDiffRespond?: (toolId: string, accepted: boolean) => void;
}

export function MessageNodeList({
  nodes,
  prevRole,
  onRewind,
  onFork,
  onStopTask,
  onDiffRespond,
}: MessageNodeListProps): React.JSX.Element {
  const groups = groupForTimeline(nodes, prevRole);

  return (
    <>
      {groups.map((group, gi) => {
        if (group.kind === 'timeline') {
          return (
            <CollapsibleTimeline
              key={group.nodes[0]?.message.id}
              nodes={group.nodes}
              onRewind={onRewind}
              onFork={onFork}
              onStopTask={onStopTask}
              onDiffRespond={onDiffRespond}
            />
          );
        }

        const showAvatar = group.node.message.role !== group.prevRole;
        return (
          <div
            key={group.node.message.id}
            data-message-id={group.node.message.id}
            className={cn('animate-fade-in py-2', gi !== 0 && 'mt-1')}
          >
            <ChatMessage
              message={group.node.message}
              showAvatar={showAvatar}
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
                  group.node.message.type === 'tool_use'
                    ? group.node.message.meta.toolId
                    : undefined
                }
              />
            )}
          </div>
        );
      })}
    </>
  );
}
