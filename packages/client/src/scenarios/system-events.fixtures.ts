import { segments as s } from '@code-quest/summoner/test';
import { msg } from '@/utils/message';
import { buildChannelState } from '../test/build-channel-state';
import type { ChannelState } from '../types/chat';

export const errorRecoveryState: Partial<ChannelState> = buildChannelState([
  s.user('Run the migration script'),
  s.assistant("I'll execute the migration now."),
  s.assistant({ toolUse: { id: 'er-t1', name: 'Bash', input: { command: 'npm run migrate' } } }),
  s.error('Connection refused'),
  s.assistant(
    'The migration failed because the database is not running. ' +
      'Start PostgreSQL with `brew services start postgresql` and try again.',
  ),
]);

export const rateLimitEventState: Partial<ChannelState> = buildChannelState([
  s.user('Refactor all test files to use vitest'),
  s.assistant("I'll start converting the test files from Jest to Vitest."),
  s.rateLimitEvent({ status: 'rate_limited', resetsAt: Date.now() + 45_000 }),
  s.assistant('Continuing the migration. Converting `auth.test.ts` next.'),
]);

export const compactBoundaryState: Partial<ChannelState> = buildChannelState([
  s.user('Help me debug the auth flow'),
  s.assistant('I traced the issue to the token refresh logic.'),
  s.compactBoundary(),
  s.assistant(
    'After reviewing the earlier context, the root cause is in `refreshToken()` — ' +
      'it does not handle expired refresh tokens gracefully.',
  ),
]);

const _interruptBase: Partial<ChannelState> = buildChannelState([
  s.user('Analyze all 200 test files'),
  s.assistant("I'll start scanning all test files in the project."),
  s.assistant({
    toolUse: {
      id: 'int-t1',
      name: 'Bash',
      input: { command: 'find . -name "*.test.ts" | head -50' },
    },
  }),
]);

export const interruptState: Partial<ChannelState> = {
  ..._interruptBase,
  messages: [
    ...(_interruptBase.messages ?? []),
    msg({ role: 'system', type: 'interrupt', content: '' }),
  ],
};

export const hookExecutionState: Partial<ChannelState> = buildChannelState([
  s.user('Commit the changes'),
  s.assistant({
    toolUse: {
      id: 'he-t1',
      name: 'Bash',
      input: { command: 'git commit -m "refactor: split auth module"' },
    },
  }),
  s.hookStarted('hook-1', 'pre-commit', 'PostToolUse'),
  s.hookResponse('hook-1', 'pre-commit', 'PostToolUse', 'All checks passed'),
  s.assistant('Commit successful. All pre-commit checks passed.'),
  s.result(),
]);
