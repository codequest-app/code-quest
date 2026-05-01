import type { SessionStateSummary } from '@code-quest/shared';
import { STORY_CHANNEL_ID } from './story-decorator';

const STORY_WORKTREE_CHANNEL_ID = 'story-worktree';
export const STORY_PROJECT_ROOT = '/Users/demo/cc-office';

export function makeSession(overrides?: Partial<SessionStateSummary>): SessionStateSummary {
  return {
    channelId: STORY_CHANNEL_ID,
    state: 'idle',
    title: 'Fix the login bug',
    projectRoot: STORY_PROJECT_ROOT,
    cwd: STORY_PROJECT_ROOT,
    ...overrides,
  };
}

export function makeWorktreeSession(overrides?: Partial<SessionStateSummary>): SessionStateSummary {
  return makeSession({
    channelId: STORY_WORKTREE_CHANNEL_ID,
    title: 'Feature: auth refactor',
    cwd: `${STORY_PROJECT_ROOT}/.claude/worktrees/feat-auth`,
    ...overrides,
  });
}
