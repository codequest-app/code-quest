/**
 * Contract test: controlPermissionResponseSchema must match the CLI's actual Zod validation.
 *
 * These test cases are derived from:
 * - Real CLI ZodError messages (the union variants the CLI actually validates)
 * - POC branch commit 00c1317 (verified working with real CLI)
 * - Fixture: apps/summoner/src/__fixtures__/claude/control-request-can-use-tool.jsonl
 *
 * If the CLI changes its expected format, update the schema AND these tests together.
 */
import { describe, expect, it } from 'vitest';
import { controlPermissionResponseSchema } from '../control.ts';

describe('controlPermissionResponseSchema (contract)', () => {
  describe('tool permission — allow', () => {
    it('accepts allow with updatedInput (original tool input echoed back)', () => {
      const result = controlPermissionResponseSchema.safeParse({
        behavior: 'allow',
        updatedInput: { file_path: '/tmp/test.txt', content: 'hello\n' },
      });
      expect(result.success).toBe(true);
    });

    it('accepts allow with empty updatedInput', () => {
      const result = controlPermissionResponseSchema.safeParse({
        behavior: 'allow',
        updatedInput: {},
      });
      expect(result.success).toBe(true);
    });

    it('accepts allow with updatedPermissions (suggestion applied)', () => {
      const result = controlPermissionResponseSchema.safeParse({
        behavior: 'allow',
        updatedInput: { file_path: '/tmp/test.txt', content: 'hello\n' },
        updatedPermissions: [
          { type: 'addDirectories', directories: ['/tmp'], destination: 'session' },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('accepts allow with toolUseID', () => {
      const result = controlPermissionResponseSchema.safeParse({
        behavior: 'allow',
        updatedInput: {},
        toolUseID: 'toolu_01WMzYXV2g4fQJTUyFgkjmar',
      });
      expect(result.success).toBe(true);
    });

    it('rejects allow without updatedInput', () => {
      const result = controlPermissionResponseSchema.safeParse({
        behavior: 'allow',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('tool permission — deny', () => {
    it('accepts deny with message and interrupt', () => {
      const result = controlPermissionResponseSchema.safeParse({
        behavior: 'deny',
        message: 'User denied this action',
        interrupt: false,
      });
      expect(result.success).toBe(true);
    });

    it('accepts deny with interrupt: true', () => {
      const result = controlPermissionResponseSchema.safeParse({
        behavior: 'deny',
        message: 'User denied this action',
        interrupt: true,
      });
      expect(result.success).toBe(true);
    });

    it('accepts deny with toolUseID', () => {
      const result = controlPermissionResponseSchema.safeParse({
        behavior: 'deny',
        message: 'Disconnected',
        interrupt: false,
        toolUseID: 'toolu_01WMzYXV2g4fQJTUyFgkjmar',
      });
      expect(result.success).toBe(true);
    });

    it('rejects deny without message', () => {
      const result = controlPermissionResponseSchema.safeParse({
        behavior: 'deny',
        interrupt: false,
      });
      expect(result.success).toBe(false);
    });

    it('rejects deny without interrupt', () => {
      const result = controlPermissionResponseSchema.safeParse({
        behavior: 'deny',
        message: 'User denied',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('hook callback', () => {
    it('accepts continue: true', () => {
      const result = controlPermissionResponseSchema.safeParse({ continue: true });
      expect(result.success).toBe(true);
    });

    it('accepts continue: false', () => {
      const result = controlPermissionResponseSchema.safeParse({ continue: false });
      expect(result.success).toBe(true);
    });
  });

  describe('rejects old/wrong formats', () => {
    it('rejects { allowed: true } (old format)', () => {
      const result = controlPermissionResponseSchema.safeParse({ allowed: true });
      expect(result.success).toBe(false);
    });

    it('rejects { allowed: false } (old format)', () => {
      const result = controlPermissionResponseSchema.safeParse({ allowed: false });
      expect(result.success).toBe(false);
    });

    it('rejects { behavior: "allow" } without updatedInput', () => {
      const result = controlPermissionResponseSchema.safeParse({ behavior: 'allow' });
      expect(result.success).toBe(false);
    });

    it('rejects { updatedInput: {} } without behavior (ambiguous)', () => {
      const result = controlPermissionResponseSchema.safeParse({ updatedInput: {} });
      expect(result.success).toBe(false);
    });

    it('rejects empty object', () => {
      const result = controlPermissionResponseSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
