import { controlAuthenticateResponseSchema, controlInitResponseSchema } from '@code-quest/schemas';
import { describe, expect, it } from 'vitest';

describe('control response schemas', () => {
  describe('controlInitResponseSchema', () => {
    it('parses response with models and commands', () => {
      const input = {
        commands: [{ name: 'commit' }, { name: 'review' }],
        models: [
          { value: 'default', displayName: 'Default', supportsFastMode: true },
          { value: 'sonnet', displayName: 'Sonnet' },
        ],
        account: { email: 'test@example.com', subscriptionType: 'Pro' },
      };
      const result = controlInitResponseSchema.parse(input);
      expect(result.commands).toHaveLength(2);
      expect(result.models).toHaveLength(2);
      expect(result.account?.email).toBe('test@example.com');
    });

    it('accepts empty/missing fields', () => {
      const result = controlInitResponseSchema.parse({});
      expect(result.commands).toBeUndefined();
      expect(result.models).toBeUndefined();
      expect(result.account).toBeUndefined();
    });
  });

  describe('controlAuthenticateResponseSchema', () => {
    it('parses auth URL response', () => {
      const input = {
        manualUrl: 'https://auth.example.com',
        automaticUrl: 'https://auto.example.com',
      };
      const result = controlAuthenticateResponseSchema.parse(input);
      expect(result.automaticUrl).toBe('https://auto.example.com');
    });

    it('accepts empty response', () => {
      const result = controlAuthenticateResponseSchema.parse({});
      expect(result.manualUrl).toBeUndefined();
    });
  });
});
