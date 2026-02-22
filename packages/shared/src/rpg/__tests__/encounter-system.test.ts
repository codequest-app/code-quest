import { describe, expect, it } from 'vitest';
import { shouldTriggerEncounter, WILDERNESS_SUB_ZONES } from '../index.ts';

describe('shouldTriggerEncounter', () => {
  it('returns no encounter when zone is town', () => {
    const result = shouldTriggerEncounter('Fix a bug in auth', 'town');
    expect(result.trigger).toBe(false);
  });

  it('returns no encounter when complexity < 8 in wilderness', () => {
    const result = shouldTriggerEncounter('fix typo', 'wilderness', 'forest');
    expect(result.trigger).toBe(false);
    expect(result.reason).toBe('complexity_too_low');
  });

  it('returns encounter when complexity >= 8 in wilderness', () => {
    const prompt =
      'implement user authentication with JWT and OAuth, refactor the database schema, add login and register endpoints with validation, create middleware for token validation, add comprehensive unit tests and integration tests, write full documentation, optimize performance and add caching, deploy to production with CI/CD pipeline, also add rate limiting and security headers';
    const result = shouldTriggerEncounter(prompt, 'wilderness', 'forest');
    expect(result.trigger).toBe(true);
    expect(result.complexity).toBeGreaterThanOrEqual(8);
  });

  it('includes subZone info in result', () => {
    const prompt =
      'refactor the entire architecture, redesign database schema, implement new API structure with tests';
    const result = shouldTriggerEncounter(prompt, 'wilderness', 'mountains');
    expect(result.subZone).toBe('mountains');
  });

  it('defaults to forest when no subZone specified', () => {
    const prompt =
      'implement user authentication with JWT, add login and register endpoints, create middleware';
    const result = shouldTriggerEncounter(prompt, 'wilderness');
    expect(result.subZone).toBe('forest');
  });

  it('returns encounter rate from sub-zone', () => {
    const prompt =
      'implement complete authentication system with OAuth, JWT, sessions, tests and documentation';
    const result = shouldTriggerEncounter(prompt, 'wilderness', 'volcano');
    if (result.trigger) {
      const volcano = WILDERNESS_SUB_ZONES.find((z) => z.id === 'volcano');
      expect(result.encounterRate).toBe(volcano?.encounterRate);
    }
  });

  it('returns no encounter in dungeon zone', () => {
    const result = shouldTriggerEncounter('implement complex feature', 'dungeon');
    expect(result.trigger).toBe(false);
  });
});
