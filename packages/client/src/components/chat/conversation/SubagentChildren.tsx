import { useState } from 'react';
import type { MessageNode } from '../../../utils/message-tree';
import { pluralize } from '../../../utils/pluralize';
import { InlineAction } from '../../ui/InlineAction';
import { RotatableChevron } from '../tool-use/message-blocks/primitives';
import { CollapsibleTimeline } from './CollapsibleTimeline';

export function SubagentChildren({
  nodes,
  onStopTask,
  onDiffRespond,
  parentToolId,
  model,
}: {
  nodes: MessageNode[];
  onStopTask?: (taskId: string) => void;
  onDiffRespond?: (toolId: string, accepted: boolean) => void;
  parentToolId?: string;
  model?: string;
}): React.JSX.Element {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="ml-7 mt-1">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-text-muted/60 hover:text-text-muted cursor-pointer select-none flex items-center gap-1 py-0.5"
        >
          <RotatableChevron open={expanded} />
          <span>{pluralize(nodes.length, 'subagent message')}</span>
        </button>
        {model && <span className="text-xs text-text-muted/40 font-mono">{model}</span>}
        {onStopTask && parentToolId && (
          <InlineAction
            variant="danger"
            title="Stop subagent"
            onClick={() => onStopTask(parentToolId)}
          >
            ■
          </InlineAction>
        )}
      </div>
      {expanded && (
        <div className="border-l-2 border-text-muted/15 pl-4 mt-1">
          <CollapsibleTimeline
            nodes={nodes}
            onStopTask={onStopTask}
            onDiffRespond={onDiffRespond}
          />
        </div>
      )}
    </div>
  );
}
