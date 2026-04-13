import type { SessionSummary } from '@code-quest/shared';
import { describe, expect, it } from 'vitest';
import { resumeRoute } from '../resume-route';

function picked(overrides: Partial<SessionSummary>): SessionSummary {
  return {
    id: 'sess-1',
    channelId: 'ch-historical',
    provider: 'claude',
    command: 'claude',
    args: '[]',
    mode: 'interactive',
    role: 'chat',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('resumeRoute', () => {
  it('returns replace when current tab is empty AND same project', () => {
    const r = resumeRoute({
      isEmpty: true,
      currentCwd: '/proj',
      currentChannelId: 'ch-current',
      picked: picked({ cwd: '/proj' }),
      spawnedChannelId: 'ch-new',
    });

    expect(r).toEqual({
      type: 'replace',
      oldChannelId: 'ch-current',
      newChannelId: 'ch-new',
    });
  });

  it('returns activate when current tab has messages (not empty)', () => {
    const r = resumeRoute({
      isEmpty: false,
      currentCwd: '/proj',
      currentChannelId: 'ch-current',
      picked: picked({ cwd: '/proj' }),
      spawnedChannelId: 'ch-new',
    });

    expect(r).toEqual({ type: 'activate', cwd: '/proj', channelId: 'ch-new' });
  });

  it('returns activate when picked session belongs to different project', () => {
    const r = resumeRoute({
      isEmpty: true,
      currentCwd: '/proj-A',
      currentChannelId: 'ch-current',
      picked: picked({ cwd: '/proj-B' }),
      spawnedChannelId: 'ch-new',
    });

    expect(r).toEqual({ type: 'activate', cwd: '/proj-B', channelId: 'ch-new' });
  });

  it('returns activate when current tab is empty but currentChannelId is null', () => {
    const r = resumeRoute({
      isEmpty: true,
      currentCwd: '/proj',
      currentChannelId: null,
      picked: picked({ cwd: '/proj' }),
      spawnedChannelId: 'ch-new',
    });

    expect(r).toEqual({ type: 'activate', cwd: '/proj', channelId: 'ch-new' });
  });

  it('returns noop when picked session has no cwd', () => {
    const r = resumeRoute({
      isEmpty: false,
      currentCwd: '/proj',
      currentChannelId: 'ch-current',
      picked: picked({ cwd: undefined }),
      spawnedChannelId: 'ch-new',
    });

    expect(r).toEqual({ type: 'noop' });
  });
});
