import type { TaskType } from '@code-quest/shared';
import { Badge } from '@/components/ui/Badge';
import type { Task } from '@/types/task';
import { AGENT_TOOLS } from '@/utils/tool-utils';

function TaskStatusBadge({
  taskStatus,
  lastToolName,
  progressText,
}: {
  taskStatus?: 'running' | 'completed' | 'failed';
  lastToolName?: string;
  progressText?: string;
}): React.JSX.Element | null {
  if (taskStatus !== 'running') return null;

  const detail = progressText ?? lastToolName;
  return (
    <span className="flex items-center gap-1 text-xs text-accent animate-pulse">
      <span>●</span>
      <span>Running{detail ? ` · ${detail}` : ''}</span>
    </span>
  );
}

export function TaskBadge({
  toolName,
  input,
  task,
}: {
  toolName: string;
  input: Record<string, unknown>;
  task?: Task;
}): React.JSX.Element | null {
  const taskType = task?.taskType;
  const taskStatus = task?.status;
  if (!AGENT_TOOLS.has(toolName) && !taskType) return null;

  const subagentType = typeof input.subagent_type === 'string' ? input.subagent_type : undefined;
  const resolvedType: TaskType | undefined = taskType ?? (subagentType ? 'subagent' : undefined);

  if (!resolvedType && !taskStatus) return null;

  return (
    <span className="flex items-center gap-1.5">
      {resolvedType && (
        <Badge variant="accent" mono>
          {resolvedType}
        </Badge>
      )}
      <TaskStatusBadge
        taskStatus={taskStatus === 'stopped' ? 'failed' : taskStatus}
        lastToolName={task?.lastToolName}
        progressText={task?.progressText}
      />
    </span>
  );
}
