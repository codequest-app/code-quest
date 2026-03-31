import { describe, expect, it } from 'vitest';
import {
  cliAuthenticateResponseSchema,
  cliInitResponseSchema,
} from '../socket/handlers/cli-response-schemas.ts';

describe('CLI response schemas', () => {
  describe('cliInitResponseSchema', () => {
    it('parses response with models and commands', () => {
      const input = {
        commands: [{ name: 'commit' }, { name: 'review' }],
        models: [
          { value: 'default', displayName: 'Default', supportsFastMode: true },
          { value: 'sonnet', displayName: 'Sonnet' },
        ],
        account: { email: 'test@example.com', subscriptionType: 'Pro' },
      };
      const result = cliInitResponseSchema.parse(input);
      expect(result.commands).toHaveLength(2);
      expect(result.models).toHaveLength(2);
      expect(result.account?.email).toBe('test@example.com');
    });

    it('accepts empty/missing fields', () => {
      const result = cliInitResponseSchema.parse({});
      expect(result.commands).toBeUndefined();
      expect(result.models).toBeUndefined();
      expect(result.account).toBeUndefined();
    });
  });

  describe('cliAuthenticateResponseSchema', () => {
    it('parses auth URL response', () => {
      const input = {
        manualUrl: 'https://auth.example.com',
        automaticUrl: 'https://auto.example.com',
      };
      const result = cliAuthenticateResponseSchema.parse(input);
      expect(result.automaticUrl).toBe('https://auto.example.com');
    });

    it('accepts empty response', () => {
      const result = cliAuthenticateResponseSchema.parse({});
      expect(result.manualUrl).toBeUndefined();
    });
  });
});
