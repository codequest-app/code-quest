import { describe, expect, it } from 'vitest';
import { streamingHandlerOn } from '@/contexts/channel/handlers/streaming.ts';
import { taskHandlerOn } from '@/contexts/channel/handlers/task.ts';
import { initialChannelState } from '@/types/chat';

const onAssistant = streamingHandlerOn['message:assistant'];
const onTaskStarted = taskHandlerOn['task:started'];

describe('task_started event', () => {
  it('with toolUseId writes to tasks Map, no system message', () => {
    let state = initialChannelState('ch');

    state = onAssistant(state, {
      channelId: 'ch',
      content: [
        { type: 'tool_use', toolId: 'toolu_1', toolName: 'Bash', input: { command: 'vitest' } },
      ],
    } as never);

    state = onTaskStarted(state, {
      channelId: 'ch',
      toolUseId: 'toolu_1',
      taskType: 'local_bash',
      description: 'Run tests',
    } as never);

    // No standalone system message
    expect(state.messages.filter((m) => m.type === 'task_started')).toHaveLength(0);

    // Task in state.tasks
    expect(state.tasks.get('toolu_1')).toMatchObject({
      status: 'running',
      taskType: 'local_bash',
      description: 'Run tests',
    });
  });

  it('without toolUseId creates system message', () => {
    let state = initialChannelState('ch');

    state = onTaskStarted(state, {
      channelId: 'ch',
      taskType: 'local_bash',
      description: 'orphan task',
    } as never);

    const systemMsgs = state.messages.filter((m) => m.type === 'task_started');
    expect(systemMsgs).toHaveLength(1);
    expect(systemMsgs[0]!.content).toBe('orphan task');
  });
});
