import { describe, expect, it } from 'vitest';
import { initialChannelState } from '@/types/chat';
import { msg } from '@/utils/message';
import { systemHandlerOn } from '../system';

const CHANNEL_ID = 'test-channel';
const TOOL_USE_ID = 'tool-123';

function stateWithToolUse() {
  const state = initialChannelState(CHANNEL_ID);
  return {
    ...state,
    messages: [
      msg({
        role: 'assistant',
        type: 'tool_use',
        content: 'Task',
        meta: { toolId: TOOL_USE_ID, input: { description: 'Analyse files' } },
      }),
    ],
  };
}

describe('onTaskStarted', () => {
  it('adds task_started system message', () => {
    const state = initialChannelState(CHANNEL_ID);
    const next = systemHandlerOn['system:task_started'](state, {
      channelId: CHANNEL_ID,
      description: 'My task',
    });
    const sysMsg = next.messages.find((m) => m.type === 'task_started');
    expect(sysMsg).toBeDefined();
    expect(sysMsg?.content).toBe('My task');
  });

  it('sets taskStatus=running and taskType on tool_use meta when toolUseId is provided', () => {
    const state = stateWithToolUse();
    const next = systemHandlerOn['system:task_started'](state, {
      channelId: CHANNEL_ID,
      description: 'Analyse files',
      taskType: 'subagent',
      toolUseId: TOOL_USE_ID,
    });
    const toolMsg = next.messages.find((m) => m.type === 'tool_use');
    expect(toolMsg?.meta).toMatchObject({ taskStatus: 'running', taskType: 'subagent' });
  });

  it('does not fail when toolUseId is missing', () => {
    const state = stateWithToolUse();
    const next = systemHandlerOn['system:task_started'](state, {
      channelId: CHANNEL_ID,
      description: 'task',
    });
    const toolMsg = next.messages.find((m) => m.type === 'tool_use');
    expect(toolMsg?.meta).not.toHaveProperty('taskStatus');
  });
});

describe('onTaskProgress', () => {
  it('updates taskStatus and lastToolName on matching tool_use', () => {
    const state = stateWithToolUse();
    const next = systemHandlerOn['system:task_progress'](state, {
      channelId: CHANNEL_ID,
      taskId: 'task-1',
      toolUseId: TOOL_USE_ID,
      lastToolName: 'Read',
    });
    const toolMsg = next.messages.find((m) => m.type === 'tool_use');
    expect(toolMsg?.meta).toMatchObject({ taskStatus: 'running', lastToolName: 'Read' });
  });

  it('ignores event when toolUseId is absent', () => {
    const state = stateWithToolUse();
    const next = systemHandlerOn['system:task_progress'](state, {
      channelId: CHANNEL_ID,
      taskId: 'task-1',
    });
    expect(next).toBe(state);
  });

  it('silently ignores unknown toolUseId', () => {
    const state = stateWithToolUse();
    const next = systemHandlerOn['system:task_progress'](state, {
      channelId: CHANNEL_ID,
      taskId: 'task-1',
      toolUseId: 'unknown-id',
      lastToolName: 'Bash',
    });
    expect(next.messages).toEqual(state.messages);
  });
});

describe('onTaskNotification', () => {
  it('sets taskStatus=completed and taskSummary', () => {
    const state = stateWithToolUse();
    const next = systemHandlerOn['system:task_notification'](state, {
      channelId: CHANNEL_ID,
      taskId: 'task-1',
      toolUseId: TOOL_USE_ID,
      status: 'completed',
      summary: 'Found 3 issues',
    });
    const toolMsg = next.messages.find((m) => m.type === 'tool_use');
    expect(toolMsg?.meta).toMatchObject({ taskStatus: 'completed', taskSummary: 'Found 3 issues' });
  });

  it('sets taskStatus=failed on failure status', () => {
    const state = stateWithToolUse();
    const next = systemHandlerOn['system:task_notification'](state, {
      channelId: CHANNEL_ID,
      taskId: 'task-1',
      toolUseId: TOOL_USE_ID,
      status: 'failed',
    });
    const toolMsg = next.messages.find((m) => m.type === 'tool_use');
    expect(toolMsg?.meta).toMatchObject({ taskStatus: 'failed' });
  });
});
