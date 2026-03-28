import { useState } from 'react';
import type { MessageNode } from '../utils/message-tree';
import { pluralize } from '../utils/pluralize';
import { MessageNodeList } from './MessageNodeList';

export function SubagentChildren({
  nodes,
  onStopTask,
  onDiffRespond,
  parentToolId,
}: {
  nodes: MessageNode[];
  onStopTask?: (taskId: string) => void;
  onDiffRespond?: (toolId: string, accepted: boolean) => void;
  parentToolId?: string;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="ml-7 mt-1">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-text-muted/50 hover:text-text-muted cursor-pointer select-none flex items-center gap-1 py-0.5"
        >
          <span className={`transition-transform ${expanded ? 'rotate-90' : ''}`}>▶</span>
          <span>{pluralize(nodes.length, 'subagent message')}</span>
        </button>
        {onStopTask && parentToolId && (
          <button
            type="button"
            title="Stop subagent"
            onClick={() => onStopTask(parentToolId)}
            className="text-[11px] text-danger hover:text-danger/80 transition-colors"
          >
            ■
          </button>
        )}
      </div>
      {expanded && (
        <div className="border-l-2 border-text-muted/15 pl-4 mt-1">
          <MessageNodeList nodes={nodes} prevRole={null} onDiffRespond={onDiffRespond} />
        </div>
      )}
    </div>
  );
}
