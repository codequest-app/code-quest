import type { PendingControl, SessionStateSummary } from '@code-quest/shared';
import type { Message } from '../types/ui';

export const STORY_CHANNEL_ID = 'story-channel';
export const STORY_WORKTREE_CHANNEL_ID = 'story-worktree';
export const STORY_PROJECT_ROOT = '/Users/demo/cc-office';

const BASE_TIMESTAMP = 1_700_000_000_000;

function t(offset: number): number {
  return BASE_TIMESTAMP + offset * 1000;
}

export function makeLongConversation(): Message[] {
  return [
    { id: 'm1', role: 'user', type: 'text', content: 'Fix the login bug', timestamp: t(0) },
    {
      id: 'm2',
      role: 'assistant',
      type: 'thinking',
      content: 'Looking at the authentication logic to identify the issue…',
      timestamp: t(1),
    },
    {
      id: 'm3',
      role: 'assistant',
      type: 'text',
      content: "I'll start by reading the auth module.",
      timestamp: t(2),
    },
    {
      id: 'm4',
      role: 'assistant',
      type: 'tool_use',
      content: 'Read',
      meta: { toolId: 't1', input: { file_path: '/src/auth.ts' } },
      timestamp: t(3),
    },
    {
      id: 'm5',
      role: 'assistant',
      type: 'tool_result',
      content: 'export function login(user, password) {\n  /* ... */\n}',
      meta: { toolId: 't1', name: 'Read' },
      timestamp: t(4),
    },
    {
      id: 'm6',
      role: 'assistant',
      type: 'tool_use',
      content: 'Grep',
      meta: { toolId: 't2', input: { pattern: 'validateUser' } },
      timestamp: t(5),
    },
    {
      id: 'm7',
      role: 'assistant',
      type: 'tool_result',
      content: 'src/auth.ts:42:  const ok = validateUser(user, password);',
      meta: { toolId: 't2', name: 'Grep' },
      timestamp: t(6),
    },
    {
      id: 'm8',
      role: 'assistant',
      type: 'text',
      content: 'Found it — `validateUser` has a null-safety bug on line 42.',
      timestamp: t(7),
    },
    {
      id: 'm9',
      role: 'user',
      type: 'text',
      content: 'Please fix it and add a test.',
      timestamp: t(8),
    },
    {
      id: 'm10',
      role: 'assistant',
      type: 'tool_use',
      content: 'Edit',
      meta: { toolId: 't3', input: { file_path: '/src/auth.ts' } },
      timestamp: t(9),
    },
    {
      id: 'm11',
      role: 'assistant',
      type: 'tool_result',
      content:
        '--- a/src/auth.ts\n+++ b/src/auth.ts\n@@ -40,4 +40,5 @@\n export function login(user, password) {\n-  const ok = validateUser(user, password);\n+  if (!user) return false;\n+  const ok = validateUser(user, password);\n   return ok;\n }',
      meta: { toolId: 't3', name: 'Edit' },
      timestamp: t(10),
    },
    {
      id: 'm12',
      role: 'assistant',
      type: 'tool_use',
      content: 'Write',
      meta: {
        toolId: 't4',
        input: { file_path: '/src/auth.test.ts' },
      },
      timestamp: t(11),
    },
    {
      id: 'm13',
      role: 'assistant',
      type: 'tool_result',
      content: 'File created: /src/auth.test.ts',
      meta: { toolId: 't4', name: 'Write' },
      timestamp: t(12),
    },
    {
      id: 'm14',
      role: 'assistant',
      type: 'tool_use',
      content: 'Bash',
      meta: { toolId: 't5', input: { command: 'pnpm test auth' } },
      timestamp: t(13),
    },
    {
      id: 'm15',
      role: 'assistant',
      type: 'tool_result',
      content: 'PASS src/auth.test.ts (3 tests, 12ms)',
      meta: { toolId: 't5', name: 'Bash' },
      timestamp: t(14),
    },
    {
      id: 'm16',
      role: 'assistant',
      type: 'text',
      content: 'All 3 tests pass. The null-safety fix is in place.',
      timestamp: t(15),
    },
    {
      id: 'm17',
      role: 'user',
      type: 'text',
      content: 'Commit with a good message.',
      timestamp: t(16),
    },
    {
      id: 'm18',
      role: 'assistant',
      type: 'tool_use',
      content: 'Bash',
      meta: {
        toolId: 't6',
        input: { command: 'git commit -am "fix(auth): null-check user before validate"' },
      },
      timestamp: t(17),
    },
    {
      id: 'm19',
      role: 'assistant',
      type: 'tool_result',
      content: '[main abc1234] fix(auth): null-check user before validate',
      meta: { toolId: 't6', name: 'Bash' },
      timestamp: t(18),
    },
    {
      id: 'm20',
      role: 'assistant',
      type: 'text',
      content: 'Done. Committed as `abc1234`.',
      timestamp: t(19),
    },
    {
      id: 'm21',
      role: 'assistant',
      type: 'result',
      content: '',
      meta: {
        stats: {
          costUsd: 0.0234,
          durationMs: 12_345,
          inputTokens: 8_200,
          outputTokens: 1_840,
          numTurns: 6,
        },
      },
      timestamp: t(20),
    },
  ];
}

export function makeProcessingWithTool(): Message[] {
  return [
    { id: 'p1', role: 'user', type: 'text', content: 'Search for TODO comments', timestamp: t(0) },
    {
      id: 'p2',
      role: 'assistant',
      type: 'text',
      content: "I'll use Grep to find them.",
      timestamp: t(1),
    },
    {
      id: 'p3',
      role: 'assistant',
      type: 'tool_use',
      content: 'Grep',
      meta: { toolId: 'tp1', input: { pattern: 'TODO', glob: '**/*.ts' } },
      timestamp: t(2),
    },
  ];
}

export function makeConversationWithDiff(): Message[] {
  return [
    { id: 'd1', role: 'user', type: 'text', content: 'Rename the function', timestamp: t(0) },
    {
      id: 'd2',
      role: 'assistant',
      type: 'tool_use',
      content: 'Edit',
      meta: { toolId: 'td1', input: { file_path: '/src/utils.ts' } },
      timestamp: t(1),
    },
    {
      id: 'd3',
      role: 'assistant',
      type: 'tool_result',
      content:
        '--- a/src/utils.ts\n+++ b/src/utils.ts\n@@ -1,6 +1,6 @@\n-export function getName(user) {\n-  return user.firstName + " " + user.lastName;\n+export function getFullName(user) {\n+  return `${user.firstName} ${user.lastName}`;\n }\n \n-export function getNameLength(user) {\n-  return getName(user).length;\n+export function getFullNameLength(user) {\n+  return getFullName(user).length;\n }',
      meta: { toolId: 'td1', name: 'Edit' },
      timestamp: t(2),
    },
  ];
}

export function makePendingPermission(overrides?: Partial<PendingControl>): PendingControl {
  return {
    requestId: 'req-1',
    subtype: 'can_use_tool',
    toolName: 'Bash',
    input: {
      command: 'rm -rf /tmp/build',
      description: 'Clean build artifacts before rebuilding',
    },
    ...overrides,
  };
}

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
