import { describe, expect, it } from 'vitest';
import {
  chatAbortSchema,
  chatAllowToolSchema,
  chatCreateSchema,
  chatKillSchema,
  chatSendSchema,
  orchestratorAbortSchema,
  orchestratorCreateSchema,
  orchestratorDispatchSchema,
  orchestratorKillSchema,
  orchestratorSynthesizeSchema,
  subTaskSchema,
  terminalCreateSchema,
  terminalKillSchema,
  terminalResizeSchema,
  terminalWriteSchema,
} from '../schemas.ts';

describe('socket schemas', () => {
  describe('terminalCreateSchema', () => {
    it('should accept undefined', () => {
      expect(terminalCreateSchema.safeParse(undefined).success).toBe(true);
    });

    it('should accept empty object', () => {
      expect(terminalCreateSchema.safeParse({}).success).toBe(true);
    });

    it('should accept valid options', () => {
      const result = terminalCreateSchema.safeParse({
        cols: 80,
        rows: 24,
        shell: '/bin/bash',
        cwd: '/tmp',
        args: ['--login'],
        env: { TERM: 'xterm' },
      });
      expect(result.success).toBe(true);
    });

    it('should reject non-integer cols', () => {
      expect(terminalCreateSchema.safeParse({ cols: 'bad' }).success).toBe(false);
    });

    it('should reject non-positive rows', () => {
      expect(terminalCreateSchema.safeParse({ rows: 0 }).success).toBe(false);
    });

    it('should reject negative cols', () => {
      expect(terminalCreateSchema.safeParse({ cols: -1 }).success).toBe(false);
    });

    it('should reject float cols', () => {
      expect(terminalCreateSchema.safeParse({ cols: 80.5 }).success).toBe(false);
    });
  });

  describe('terminalWriteSchema', () => {
    it('should accept valid input', () => {
      const result = terminalWriteSchema.safeParse({ sessionId: 'abc', data: 'hello' });
      expect(result.success).toBe(true);
    });

    it('should reject empty sessionId', () => {
      expect(terminalWriteSchema.safeParse({ sessionId: '', data: 'hello' }).success).toBe(false);
    });

    it('should reject missing data', () => {
      expect(terminalWriteSchema.safeParse({ sessionId: 'abc' }).success).toBe(false);
    });
  });

  describe('terminalResizeSchema', () => {
    it('should accept valid input', () => {
      const result = terminalResizeSchema.safeParse({ sessionId: 'abc', cols: 120, rows: 40 });
      expect(result.success).toBe(true);
    });

    it('should reject negative cols', () => {
      expect(terminalResizeSchema.safeParse({ sessionId: 'abc', cols: -1, rows: 40 }).success).toBe(
        false,
      );
    });

    it('should reject zero rows', () => {
      expect(terminalResizeSchema.safeParse({ sessionId: 'abc', cols: 80, rows: 0 }).success).toBe(
        false,
      );
    });

    it('should reject float cols', () => {
      expect(
        terminalResizeSchema.safeParse({ sessionId: 'abc', cols: 80.5, rows: 40 }).success,
      ).toBe(false);
    });
  });

  describe('terminalKillSchema', () => {
    it('should accept valid sessionId', () => {
      expect(terminalKillSchema.safeParse({ sessionId: 'abc' }).success).toBe(true);
    });

    it('should reject empty sessionId', () => {
      expect(terminalKillSchema.safeParse({ sessionId: '' }).success).toBe(false);
    });
  });

  describe('chatCreateSchema', () => {
    it('should accept claude provider', () => {
      expect(chatCreateSchema.safeParse({ provider: 'claude' }).success).toBe(true);
    });

    it('should accept gemini provider', () => {
      expect(chatCreateSchema.safeParse({ provider: 'gemini' }).success).toBe(true);
    });

    it('should accept provider with optional cwd', () => {
      expect(chatCreateSchema.safeParse({ provider: 'claude', cwd: '/tmp' }).success).toBe(true);
    });

    it('should reject invalid provider', () => {
      expect(chatCreateSchema.safeParse({ provider: 'openai' }).success).toBe(false);
    });

    it('should reject missing provider', () => {
      expect(chatCreateSchema.safeParse({}).success).toBe(false);
    });
  });

  describe('chatSendSchema', () => {
    it('should accept valid input', () => {
      const result = chatSendSchema.safeParse({ sessionId: 'abc', message: 'hello' });
      expect(result.success).toBe(true);
    });

    it('should reject empty message', () => {
      expect(chatSendSchema.safeParse({ sessionId: 'abc', message: '' }).success).toBe(false);
    });

    it('should reject empty sessionId', () => {
      expect(chatSendSchema.safeParse({ sessionId: '', message: 'hello' }).success).toBe(false);
    });
  });

  describe('chatAbortSchema', () => {
    it('should accept valid sessionId', () => {
      expect(chatAbortSchema.safeParse({ sessionId: 'abc' }).success).toBe(true);
    });

    it('should reject empty sessionId', () => {
      expect(chatAbortSchema.safeParse({ sessionId: '' }).success).toBe(false);
    });
  });

  describe('chatAllowToolSchema', () => {
    it('should accept valid input', () => {
      const result = chatAllowToolSchema.safeParse({ sessionId: 'abc', toolName: 'bash' });
      expect(result.success).toBe(true);
    });

    it('should reject empty toolName', () => {
      expect(chatAllowToolSchema.safeParse({ sessionId: 'abc', toolName: '' }).success).toBe(false);
    });
  });

  describe('chatKillSchema', () => {
    it('should accept valid sessionId', () => {
      expect(chatKillSchema.safeParse({ sessionId: 'abc' }).success).toBe(true);
    });

    it('should reject empty sessionId', () => {
      expect(chatKillSchema.safeParse({ sessionId: '' }).success).toBe(false);
    });
  });

  describe('subTaskSchema', () => {
    it('should accept valid subtask', () => {
      const result = subTaskSchema.safeParse({ description: 'do stuff', provider: 'claude' });
      expect(result.success).toBe(true);
    });

    it('should reject empty description', () => {
      expect(subTaskSchema.safeParse({ description: '', provider: 'claude' }).success).toBe(false);
    });

    it('should reject invalid provider', () => {
      expect(subTaskSchema.safeParse({ description: 'do stuff', provider: 'openai' }).success).toBe(
        false,
      );
    });
  });

  describe('orchestratorCreateSchema', () => {
    it('should accept valid provider', () => {
      expect(orchestratorCreateSchema.safeParse({ provider: 'claude' }).success).toBe(true);
    });

    it('should reject invalid provider', () => {
      expect(orchestratorCreateSchema.safeParse({ provider: 'openai' }).success).toBe(false);
    });
  });

  describe('orchestratorDispatchSchema', () => {
    it('should accept valid input', () => {
      const result = orchestratorDispatchSchema.safeParse({
        orchId: 'abc',
        tasks: [{ description: 'task1', provider: 'claude' }],
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty tasks array', () => {
      expect(orchestratorDispatchSchema.safeParse({ orchId: 'abc', tasks: [] }).success).toBe(
        false,
      );
    });

    it('should reject empty orchId', () => {
      expect(
        orchestratorDispatchSchema.safeParse({
          orchId: '',
          tasks: [{ description: 'task1', provider: 'claude' }],
        }).success,
      ).toBe(false);
    });

    it('should reject task with empty description', () => {
      expect(
        orchestratorDispatchSchema.safeParse({
          orchId: 'abc',
          tasks: [{ description: '', provider: 'claude' }],
        }).success,
      ).toBe(false);
    });
  });

  describe('orchestratorSynthesizeSchema', () => {
    it('should accept valid orchId', () => {
      expect(orchestratorSynthesizeSchema.safeParse({ orchId: 'abc' }).success).toBe(true);
    });

    it('should reject empty orchId', () => {
      expect(orchestratorSynthesizeSchema.safeParse({ orchId: '' }).success).toBe(false);
    });
  });

  describe('orchestratorAbortSchema', () => {
    it('should accept valid orchId', () => {
      expect(orchestratorAbortSchema.safeParse({ orchId: 'abc' }).success).toBe(true);
    });

    it('should reject empty orchId', () => {
      expect(orchestratorAbortSchema.safeParse({ orchId: '' }).success).toBe(false);
    });
  });

  describe('orchestratorKillSchema', () => {
    it('should accept valid orchId', () => {
      expect(orchestratorKillSchema.safeParse({ orchId: 'abc' }).success).toBe(true);
    });

    it('should reject empty orchId', () => {
      expect(orchestratorKillSchema.safeParse({ orchId: '' }).success).toBe(false);
    });
  });
});
