import type { ChannelState } from '@/types/chat';
import type { Task } from '@/types/task';
import { addMessage } from '@/utils/message';
import type { Payload } from './guard.ts';

function onTaskStarted(state: ChannelState, p: Payload<'task:started'>): ChannelState {
  if (!p.toolUseId) {
    return addMessage(state, {
      role: 'system',
      type: 'task_started',
      content: p.description,
      taskType: p.taskType,
    });
  }
  const task: Task = {
    toolUseId: p.toolUseId,
    taskType: p.taskType ?? 'local_bash',
    status: 'running',
    description: p.description,
  };
  const tasks = new Map(state.tasks);
  tasks.set(p.toolUseId, task);
  return { ...state, tasks };
}

function onTaskProgress(state: ChannelState, p: Payload<'task:progress'>): ChannelState {
  if (!p.toolUseId) return state;
  const existing = state.tasks.get(p.toolUseId);
  if (!existing) return state;
  const tasks = new Map(state.tasks);
  tasks.set(p.toolUseId, {
    ...existing,
    progressText: p.description,
    lastToolName: p.lastToolName,
  });
  return { ...state, tasks };
}

function onTaskNotification(state: ChannelState, p: Payload<'task:notification'>): ChannelState {
  if (!p.toolUseId || !p.status) return state;
  const existing = state.tasks.get(p.toolUseId);
  if (!existing) return state;
  const tasks = new Map(state.tasks);
  tasks.set(p.toolUseId, {
    ...existing,
    status: p.status === 'failed' ? 'failed' : p.status === 'stopped' ? 'stopped' : 'completed',
    summary: p.summary,
    ...(p.usage
      ? {
          usage: {
            inputTokens: Number(p.usage.input_tokens ?? 0),
            outputTokens: Number(p.usage.output_tokens ?? 0),
          },
        }
      : {}),
  });
  return { ...state, tasks };
}

export const taskHandlerOn: {
  'task:started': typeof onTaskStarted;
  'task:progress': typeof onTaskProgress;
  'task:notification': typeof onTaskNotification;
} = {
  'task:started': onTaskStarted,
  'task:progress': onTaskProgress,
  'task:notification': onTaskNotification,
} satisfies Record<string, (state: ChannelState, payload: never) => ChannelState>;
