import { describe, expect, it } from 'vitest';
import { initialChannelState } from '@/types/chat';
import { taskHandlerOn } from '../task.ts';

const onTaskStarted = taskHandlerOn['task:started'];
const onTaskProgress = taskHandlerOn['task:progress'];
const onTaskNotification = taskHandlerOn['task:notification'];

describe('Task domain handler', () => {
  describe('onTaskStarted', () => {
    it('creates task entry with status=running', () => {
      const state = initialChannelState('ch');
      const next = onTaskStarted(state, {
        channelId: 'ch',
        toolUseId: 'toolu_1',
        taskType: 'local_bash',
        description: 'npx vitest run',
      } as never);

      expect(next.tasks.get('toolu_1')).toEqual({
        toolUseId: 'toolu_1',
        taskType: 'local_bash',
        status: 'running',
        description: 'npx vitest run',
      });
    });

    it('creates local_agent task', () => {
      const state = initialChannelState('ch');
      const next = onTaskStarted(state, {
        channelId: 'ch',
        toolUseId: 'toolu_agent',
        taskType: 'local_agent',
        description: 'Explore address/favorites state',
      } as never);

      expect(next.tasks.get('toolu_agent')).toMatchObject({
        taskType: 'local_agent',
        status: 'running',
      });
    });

    it('without toolUseId does nothing', () => {
      const state = initialChannelState('ch');
      const next = onTaskStarted(state, {
        channelId: 'ch',
        taskType: 'local_bash',
        description: 'orphan',
      } as never);

      expect(next.tasks.size).toBe(0);
    });
  });

  describe('onTaskProgress (local_agent only)', () => {
    it('updates progressText and lastToolName', () => {
      let state = initialChannelState('ch');
      state = onTaskStarted(state, {
        channelId: 'ch',
        toolUseId: 'toolu_agent',
        taskType: 'local_agent',
        description: 'Explore',
      } as never);

      state = onTaskProgress(state, {
        channelId: 'ch',
        taskId: 'task_1',
        toolUseId: 'toolu_agent',
        description: 'Reading src/lib/i18n.ts',
        lastToolName: 'Read',
      } as never);

      const task = state.tasks.get('toolu_agent');
      expect(task?.progressText).toBe('Reading src/lib/i18n.ts');
      expect(task?.lastToolName).toBe('Read');
    });

    it('updates progressText multiple times', () => {
      let state = initialChannelState('ch');
      state = onTaskStarted(state, {
        channelId: 'ch',
        toolUseId: 'toolu_agent',
        taskType: 'local_agent',
        description: 'Explore',
      } as never);

      state = onTaskProgress(state, {
        channelId: 'ch',
        taskId: 'task_1',
        toolUseId: 'toolu_agent',
        description: 'Finding files',
        lastToolName: 'Glob',
      } as never);

      state = onTaskProgress(state, {
        channelId: 'ch',
        taskId: 'task_1',
        toolUseId: 'toolu_agent',
        description: 'Reading main.ts',
        lastToolName: 'Read',
      } as never);

      expect(state.tasks.get('toolu_agent')?.progressText).toBe('Reading main.ts');
      expect(state.tasks.get('toolu_agent')?.lastToolName).toBe('Read');
    });

    it('ignores progress for unknown toolUseId', () => {
      const state = initialChannelState('ch');
      const next = onTaskProgress(state, {
        channelId: 'ch',
        taskId: 'task_1',
        toolUseId: 'toolu_unknown',
        description: 'something',
      } as never);

      expect(next.tasks.size).toBe(0);
    });
  });

  describe('onTaskNotification', () => {
    it('sets status to completed', () => {
      let state = initialChannelState('ch');
      state = onTaskStarted(state, {
        channelId: 'ch',
        toolUseId: 'toolu_1',
        taskType: 'local_bash',
        description: 'vitest run',
      } as never);

      state = onTaskNotification(state, {
        channelId: 'ch',
        taskId: 'task_1',
        toolUseId: 'toolu_1',
        status: 'completed',
        summary: 'Tests 22 passed',
      } as never);

      expect(state.tasks.get('toolu_1')?.status).toBe('completed');
      expect(state.tasks.get('toolu_1')?.summary).toBe('Tests 22 passed');
    });

    it('sets status to failed', () => {
      let state = initialChannelState('ch');
      state = onTaskStarted(state, {
        channelId: 'ch',
        toolUseId: 'toolu_1',
        taskType: 'local_bash',
        description: 'vitest run',
      } as never);

      state = onTaskNotification(state, {
        channelId: 'ch',
        taskId: 'task_1',
        toolUseId: 'toolu_1',
        status: 'failed',
      } as never);

      expect(state.tasks.get('toolu_1')?.status).toBe('failed');
    });

    it('sets status to stopped', () => {
      let state = initialChannelState('ch');
      state = onTaskStarted(state, {
        channelId: 'ch',
        toolUseId: 'toolu_1',
        taskType: 'local_agent',
        description: 'agent task',
      } as never);

      state = onTaskNotification(state, {
        channelId: 'ch',
        taskId: 'task_1',
        toolUseId: 'toolu_1',
        status: 'stopped',
      } as never);

      expect(state.tasks.get('toolu_1')?.status).toBe('stopped');
    });

    it('stores usage when provided', () => {
      let state = initialChannelState('ch');
      state = onTaskStarted(state, {
        channelId: 'ch',
        toolUseId: 'toolu_1',
        taskType: 'local_agent',
        description: 'agent',
      } as never);

      state = onTaskNotification(state, {
        channelId: 'ch',
        taskId: 'task_1',
        toolUseId: 'toolu_1',
        status: 'completed',
        usage: { input_tokens: 5000, output_tokens: 1200 },
      } as never);

      expect(state.tasks.get('toolu_1')?.usage).toEqual({
        inputTokens: 5000,
        outputTokens: 1200,
      });
    });

    it('ignores notification without status', () => {
      let state = initialChannelState('ch');
      state = onTaskStarted(state, {
        channelId: 'ch',
        toolUseId: 'toolu_1',
        taskType: 'local_bash',
        description: 'task',
      } as never);

      state = onTaskNotification(state, {
        channelId: 'ch',
        taskId: 'task_1',
        toolUseId: 'toolu_1',
        status: null,
      } as never);

      expect(state.tasks.get('toolu_1')?.status).toBe('running');
    });

    it('ignores notification for unknown toolUseId', () => {
      const state = initialChannelState('ch');
      const next = onTaskNotification(state, {
        channelId: 'ch',
        taskId: 'task_1',
        toolUseId: 'toolu_unknown',
        status: 'completed',
      } as never);

      expect(next.tasks.size).toBe(0);
    });
  });

  describe('local_bash lifecycle (no progress)', () => {
    it('started → notification(completed), no progress in between', () => {
      let state = initialChannelState('ch');

      state = onTaskStarted(state, {
        channelId: 'ch',
        toolUseId: 'toolu_bash',
        taskType: 'local_bash',
        description: 'git add && git commit',
      } as never);

      expect(state.tasks.get('toolu_bash')?.status).toBe('running');
      expect(state.tasks.get('toolu_bash')?.progressText).toBeUndefined();

      state = onTaskNotification(state, {
        channelId: 'ch',
        taskId: 'task_1',
        toolUseId: 'toolu_bash',
        status: 'completed',
        summary: 'lefthook: biome ✓',
      } as never);

      expect(state.tasks.get('toolu_bash')?.status).toBe('completed');
      expect(state.tasks.get('toolu_bash')?.progressText).toBeUndefined();
    });
  });

  describe('local_agent lifecycle (with progress)', () => {
    it('started → progress × N → notification(completed)', () => {
      let state = initialChannelState('ch');

      state = onTaskStarted(state, {
        channelId: 'ch',
        toolUseId: 'toolu_agent',
        taskType: 'local_agent',
        description: 'Explore address/favorites state',
      } as never);

      state = onTaskProgress(state, {
        channelId: 'ch',
        taskId: 'task_1',
        toolUseId: 'toolu_agent',
        description: 'Finding apps/teasaren/**/*address*',
        lastToolName: 'Glob',
      } as never);

      state = onTaskProgress(state, {
        channelId: 'ch',
        taskId: 'task_1',
        toolUseId: 'toolu_agent',
        description: 'Reading AccountAddress.tsx',
        lastToolName: 'Read',
      } as never);

      expect(state.tasks.get('toolu_agent')?.progressText).toBe('Reading AccountAddress.tsx');

      state = onTaskNotification(state, {
        channelId: 'ch',
        taskId: 'task_1',
        toolUseId: 'toolu_agent',
        status: 'completed',
        summary: 'Found 3 address components',
        usage: { input_tokens: 8000, output_tokens: 2000 },
      } as never);

      const task = state.tasks.get('toolu_agent')!;
      expect(task.status).toBe('completed');
      expect(task.summary).toBe('Found 3 address components');
      expect(task.usage).toEqual({ inputTokens: 8000, outputTokens: 2000 });
      expect(task.progressText).toBe('Reading AccountAddress.tsx');
    });
  });
});
