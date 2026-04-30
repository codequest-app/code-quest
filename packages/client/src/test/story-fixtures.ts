import type { PendingControl, SessionStateSummary } from '@code-quest/shared';
import type { Message } from '../types/ui';
import { STORY_CHANNEL_ID } from './story-decorator';

const STORY_WORKTREE_CHANNEL_ID = 'story-worktree';
export const STORY_PROJECT_ROOT = '/Users/demo/cc-office';

const BASE_TIMESTAMP = 1_700_000_000_000;

function offsetToTimestamp(offset: number): number {
  return BASE_TIMESTAMP + offset * 1000;
}

export function makeLongConversation(): Message[] {
  return [
    {
      id: 'm1',
      role: 'user',
      type: 'text',
      content: 'Fix the login bug',
      timestamp: offsetToTimestamp(0),
    },
    {
      id: 'm2',
      role: 'assistant',
      type: 'thinking',
      content: 'Looking at the authentication logic to identify the issue…',
      timestamp: offsetToTimestamp(1),
    },
    {
      id: 'm3',
      role: 'assistant',
      type: 'text',
      content: "I'll start by reading the auth module.",
      timestamp: offsetToTimestamp(2),
    },
    {
      id: 'm4',
      role: 'assistant',
      type: 'tool_use',
      content: 'Read',
      meta: { toolId: 't1', input: { file_path: '/src/auth.ts' } },
      timestamp: offsetToTimestamp(3),
    },
    {
      id: 'm5',
      role: 'assistant',
      type: 'tool_result',
      content: 'export function login(user, password) {\n  /* ... */\n}',
      meta: { toolId: 't1', name: 'Read' },
      timestamp: offsetToTimestamp(4),
    },
    {
      id: 'm6',
      role: 'assistant',
      type: 'tool_use',
      content: 'Grep',
      meta: { toolId: 't2', input: { pattern: 'validateUser' } },
      timestamp: offsetToTimestamp(5),
    },
    {
      id: 'm7',
      role: 'assistant',
      type: 'tool_result',
      content: 'src/auth.ts:42:  const ok = validateUser(user, password);',
      meta: { toolId: 't2', name: 'Grep' },
      timestamp: offsetToTimestamp(6),
    },
    {
      id: 'm8',
      role: 'assistant',
      type: 'text',
      content: 'Found it — `validateUser` has a null-safety bug on line 42.',
      timestamp: offsetToTimestamp(7),
    },
    {
      id: 'm9',
      role: 'user',
      type: 'text',
      content: 'Please fix it and add a test.',
      timestamp: offsetToTimestamp(8),
    },
    {
      id: 'm10',
      role: 'assistant',
      type: 'tool_use',
      content: 'Edit',
      meta: { toolId: 't3', input: { file_path: '/src/auth.ts' } },
      timestamp: offsetToTimestamp(9),
    },
    {
      id: 'm11',
      role: 'assistant',
      type: 'tool_result',
      content:
        '--- a/src/auth.ts\n+++ b/src/auth.ts\n@@ -40,4 +40,5 @@\n export function login(user, password) {\n-  const ok = validateUser(user, password);\n+  if (!user) return false;\n+  const ok = validateUser(user, password);\n   return ok;\n }',
      meta: { toolId: 't3', name: 'Edit' },
      timestamp: offsetToTimestamp(10),
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
      timestamp: offsetToTimestamp(11),
    },
    {
      id: 'm13',
      role: 'assistant',
      type: 'tool_result',
      content: 'File created: /src/auth.test.ts',
      meta: { toolId: 't4', name: 'Write' },
      timestamp: offsetToTimestamp(12),
    },
    {
      id: 'm14',
      role: 'assistant',
      type: 'tool_use',
      content: 'Bash',
      meta: { toolId: 't5', input: { command: 'pnpm test auth' } },
      timestamp: offsetToTimestamp(13),
    },
    {
      id: 'm15',
      role: 'assistant',
      type: 'tool_result',
      content: 'PASS src/auth.test.ts (3 tests, 12ms)',
      meta: { toolId: 't5', name: 'Bash' },
      timestamp: offsetToTimestamp(14),
    },
    {
      id: 'm16',
      role: 'assistant',
      type: 'text',
      content: 'All 3 tests pass. The null-safety fix is in place.',
      timestamp: offsetToTimestamp(15),
    },
    {
      id: 'm17',
      role: 'user',
      type: 'text',
      content: 'Commit with a good message.',
      timestamp: offsetToTimestamp(16),
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
      timestamp: offsetToTimestamp(17),
    },
    {
      id: 'm19',
      role: 'assistant',
      type: 'tool_result',
      content: '[main abc1234] fix(auth): null-check user before validate',
      meta: { toolId: 't6', name: 'Bash' },
      timestamp: offsetToTimestamp(18),
    },
    {
      id: 'm20',
      role: 'assistant',
      type: 'text',
      content: 'Done. Committed as `abc1234`.',
      timestamp: offsetToTimestamp(19),
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
      timestamp: offsetToTimestamp(20),
    },
  ];
}

export function makeProcessingWithTool(): Message[] {
  return [
    {
      id: 'p1',
      role: 'user',
      type: 'text',
      content: 'Search for TODO comments',
      timestamp: offsetToTimestamp(0),
    },
    {
      id: 'p2',
      role: 'assistant',
      type: 'text',
      content: "I'll use Grep to find them.",
      timestamp: offsetToTimestamp(1),
    },
    {
      id: 'p3',
      role: 'assistant',
      type: 'tool_use',
      content: 'Grep',
      meta: { toolId: 'tp1', input: { pattern: 'TODO', glob: '**/*.ts' } },
      timestamp: offsetToTimestamp(2),
    },
  ];
}

export function makeConversationWithDiff(): Message[] {
  return [
    {
      id: 'd1',
      role: 'user',
      type: 'text',
      content: 'Rename the function',
      timestamp: offsetToTimestamp(0),
    },
    {
      id: 'd2',
      role: 'assistant',
      type: 'tool_use',
      content: 'Edit',
      meta: { toolId: 'td1', input: { file_path: '/src/utils.ts' } },
      timestamp: offsetToTimestamp(1),
    },
    {
      id: 'd3',
      role: 'assistant',
      type: 'tool_result',
      content:
        '--- a/src/utils.ts\n+++ b/src/utils.ts\n@@ -1,6 +1,6 @@\n-export function getName(user) {\n-  return user.firstName + " " + user.lastName;\n+export function getFullName(user) {\n+  return `${user.firstName} ${user.lastName}`;\n }\n \n-export function getNameLength(user) {\n-  return getName(user).length;\n+export function getFullNameLength(user) {\n+  return getFullName(user).length;\n }',
      meta: { toolId: 'td1', name: 'Edit' },
      timestamp: offsetToTimestamp(2),
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

// ── Permission scenario fixtures ──

export function makeToolApprovalFlow(): { messages: Message[]; pending: PendingControl[] } {
  return {
    messages: [
      {
        id: 'ta1',
        role: 'user',
        type: 'text',
        content: 'Clean up the build artifacts',
        timestamp: offsetToTimestamp(0),
      },
      {
        id: 'ta2',
        role: 'assistant',
        type: 'text',
        content: "I'll remove the build directory to start fresh.",
        timestamp: offsetToTimestamp(1),
      },
      {
        id: 'ta3',
        role: 'assistant',
        type: 'pending_action',
        content: 'Bash',
        meta: { requestId: 'req-1', input: { command: 'rm -rf /tmp/build' } },
        timestamp: offsetToTimestamp(2),
      },
    ],
    pending: [
      {
        requestId: 'req-1',
        subtype: 'can_use_tool',
        toolName: 'Bash',
        input: {
          command: 'rm -rf /tmp/build',
          description: 'Clean build artifacts before rebuilding',
        },
      },
    ],
  };
}

export function makeToolDenialFlow(): { messages: Message[]; pending: PendingControl[] } {
  return {
    messages: [
      {
        id: 'td1',
        role: 'user',
        type: 'text',
        content: 'Delete all log files',
        timestamp: offsetToTimestamp(0),
      },
      {
        id: 'td2',
        role: 'assistant',
        type: 'text',
        content: "I'll remove the log files.",
        timestamp: offsetToTimestamp(1),
      },
      {
        id: 'td3',
        role: 'assistant',
        type: 'pending_action',
        content: 'Bash',
        meta: { requestId: 'req-deny', input: { command: 'rm -rf /var/log/app/*' } },
        timestamp: offsetToTimestamp(2),
      },
    ],
    pending: [
      {
        requestId: 'req-deny',
        subtype: 'can_use_tool',
        toolName: 'Bash',
        input: {
          command: 'rm -rf /var/log/app/*',
          description: 'Remove all application log files',
        },
      },
    ],
  };
}

export function makePlanReviewFlow(): { messages: Message[]; pending: PendingControl[] } {
  return {
    messages: [
      {
        id: 'pr1',
        role: 'user',
        type: 'text',
        content: 'Refactor the auth module',
        timestamp: offsetToTimestamp(0),
      },
      {
        id: 'pr2',
        role: 'assistant',
        type: 'text',
        content:
          "Here's my plan:\n\n" +
          '1. Extract `validateUser` into its own module\n' +
          '2. Add proper error types\n' +
          '3. Update tests\n\n' +
          'Shall I proceed?',
        timestamp: offsetToTimestamp(1),
      },
      {
        id: 'pr3',
        role: 'assistant',
        type: 'pending_action',
        content: 'ExitPlanMode',
        meta: { requestId: 'req-plan', input: {} },
        timestamp: offsetToTimestamp(2),
      },
    ],
    pending: [
      {
        requestId: 'req-plan',
        subtype: 'exit_plan_mode',
        toolName: 'ExitPlanMode',
        input: {},
      },
    ],
  };
}

// ── Scenario fixtures ──

export function makeSimpleQA(): Message[] {
  return [
    {
      id: 'qa1',
      role: 'user',
      type: 'text',
      content: 'What does this project do?',
      timestamp: offsetToTimestamp(0),
    },
    {
      id: 'qa2',
      role: 'assistant',
      type: 'text',
      content:
        'This is a **chat interface** for Claude Code. It provides:\n\n' +
        '- Real-time conversation with Claude\n' +
        '- Tool execution (Bash, Read, Edit, etc.)\n' +
        '- Permission management for tool approval\n' +
        '- Session history and context management\n\n' +
        'The frontend is built with React + Tailwind, communicating with a Node.js backend via WebSocket.',
      timestamp: offsetToTimestamp(1),
    },
  ];
}

export function makeReadAndGrep(): Message[] {
  return [
    {
      id: 'rg1',
      role: 'user',
      type: 'text',
      content: 'Find where the login function is defined and show me the code',
      timestamp: offsetToTimestamp(0),
    },
    {
      id: 'rg2',
      role: 'assistant',
      type: 'text',
      content: "I'll search for the login function first.",
      timestamp: offsetToTimestamp(1),
    },
    {
      id: 'rg3',
      role: 'assistant',
      type: 'tool_use',
      content: 'Grep',
      meta: { toolId: 'rg-t1', input: { pattern: 'export function login', include: '**/*.ts' } },
      timestamp: offsetToTimestamp(2),
    },
    {
      id: 'rg4',
      role: 'assistant',
      type: 'tool_result',
      content:
        'src/auth/login.ts:15:export function login(email: string, password: string): Promise<Session>',
      meta: { toolId: 'rg-t1', name: 'Grep' },
      timestamp: offsetToTimestamp(3),
    },
    {
      id: 'rg5',
      role: 'assistant',
      type: 'text',
      content: 'Found it in `src/auth/login.ts`. Let me read the full file.',
      timestamp: offsetToTimestamp(4),
    },
    {
      id: 'rg6',
      role: 'assistant',
      type: 'tool_use',
      content: 'Read',
      meta: { toolId: 'rg-t2', input: { file_path: '/src/auth/login.ts' } },
      timestamp: offsetToTimestamp(5),
    },
    {
      id: 'rg7',
      role: 'assistant',
      type: 'tool_result',
      content:
        'import { hash } from "../utils/crypto";\nimport { db } from "../db";\n\n' +
        'interface Session {\n  token: string;\n  userId: string;\n  expiresAt: Date;\n}\n\n' +
        'export async function login(\n  email: string,\n  password: string,\n): Promise<Session> {\n' +
        '  const user = await db.users.findByEmail(email);\n' +
        '  if (!user) throw new Error("User not found");\n\n' +
        '  const valid = await hash.verify(password, user.passwordHash);\n' +
        '  if (!valid) throw new Error("Invalid password");\n\n' +
        '  return db.sessions.create({ userId: user.id });\n}\n',
      meta: { toolId: 'rg-t2', name: 'Read' },
      timestamp: offsetToTimestamp(6),
    },
    {
      id: 'rg8',
      role: 'assistant',
      type: 'text',
      content:
        'The `login` function is in `src/auth/login.ts` (line 15). It:\n\n' +
        '1. Looks up the user by email\n' +
        '2. Verifies the password hash\n' +
        '3. Creates and returns a new session\n\n' +
        'It throws on invalid credentials rather than returning null.',
      timestamp: offsetToTimestamp(7),
    },
  ];
}

export function makeBashExecution(): Message[] {
  return [
    {
      id: 'be1',
      role: 'user',
      type: 'text',
      content: 'Run the tests and show me the results',
      timestamp: offsetToTimestamp(0),
    },
    {
      id: 'be2',
      role: 'assistant',
      type: 'text',
      content: "I'll run the test suite.",
      timestamp: offsetToTimestamp(1),
    },
    {
      id: 'be3',
      role: 'assistant',
      type: 'tool_use',
      content: 'Bash',
      meta: { toolId: 'be-t1', input: { command: 'pnpm test --reporter=verbose' } },
      timestamp: offsetToTimestamp(2),
    },
    {
      id: 'be4',
      role: 'assistant',
      type: 'tool_result',
      content:
        ' ✓ src/auth/login.test.ts (3 tests) 12ms\n' +
        '   ✓ login with valid credentials returns session\n' +
        '   ✓ login with wrong password throws\n' +
        '   ✓ login with unknown email throws\n' +
        ' ✓ src/utils/crypto.test.ts (2 tests) 8ms\n' +
        '   ✓ hash produces consistent output\n' +
        '   ✓ verify rejects wrong input\n' +
        ' ✗ src/db/migrations.test.ts (1 test) 45ms\n' +
        '   ✗ migration 003 adds index on email\n' +
        '     → Expected index "idx_users_email" to exist\n\n' +
        ' Test Files  2 passed | 1 failed (3)\n' +
        '      Tests  5 passed | 1 failed (6)\n' +
        '   Duration  1.23s',
      meta: { toolId: 'be-t1', name: 'Bash' },
      timestamp: offsetToTimestamp(3),
    },
    {
      id: 'be5',
      role: 'assistant',
      type: 'text',
      content:
        "5 of 6 tests pass. There's **1 failure** in `src/db/migrations.test.ts`:\n\n" +
        "> migration 003 expects an index `idx_users_email` that doesn't exist yet.\n\n" +
        "This likely means the migration hasn't been applied. Want me to fix it?",
      timestamp: offsetToTimestamp(4),
    },
  ];
}

export function makeEditWithDiff(): Message[] {
  return [
    {
      id: 'ed1',
      role: 'user',
      type: 'text',
      content: 'Add null-check for the user parameter in the login function',
      timestamp: offsetToTimestamp(0),
    },
    {
      id: 'ed2',
      role: 'assistant',
      type: 'text',
      content: "I'll add an early return for null/undefined user input.",
      timestamp: offsetToTimestamp(1),
    },
    {
      id: 'ed3',
      role: 'assistant',
      type: 'tool_use',
      content: 'Edit',
      meta: { toolId: 'ed-t1', input: { file_path: '/src/auth/login.ts' } },
      timestamp: offsetToTimestamp(2),
    },
    {
      id: 'ed4',
      role: 'assistant',
      type: 'tool_result',
      content:
        '--- a/src/auth/login.ts\n' +
        '+++ b/src/auth/login.ts\n' +
        '@@ -12,6 +12,8 @@\n' +
        ' export async function login(\n' +
        '   email: string,\n' +
        '   password: string,\n' +
        ' ): Promise<Session> {\n' +
        '+  if (!email || !password) {\n' +
        '+    throw new Error("Email and password are required");\n' +
        '+  }\n' +
        '   const user = await db.users.findByEmail(email);\n' +
        '   if (!user) throw new Error("User not found");\n',
      meta: { toolId: 'ed-t1', name: 'Edit' },
      timestamp: offsetToTimestamp(3),
    },
    {
      id: 'ed5',
      role: 'assistant',
      type: 'text',
      content:
        'Added a guard clause at the top of `login()` that throws if `email` or `password` is falsy. ' +
        'This prevents the function from hitting the database with invalid input.',
      timestamp: offsetToTimestamp(4),
    },
  ];
}

// ── System Events fixtures ──

export function makeErrorRecovery(): Message[] {
  return [
    {
      id: 'er1',
      role: 'user',
      type: 'text',
      content: 'Run the migration script',
      timestamp: offsetToTimestamp(0),
    },
    {
      id: 'er2',
      role: 'assistant',
      type: 'text',
      content: "I'll execute the migration now.",
      timestamp: offsetToTimestamp(1),
    },
    {
      id: 'er3',
      role: 'assistant',
      type: 'tool_use',
      content: 'Bash',
      meta: { toolId: 'er-t1', input: { command: 'npm run migrate' } },
      timestamp: offsetToTimestamp(2),
    },
    {
      id: 'er4',
      role: 'system',
      type: 'error',
      content: 'Connection refused',
      meta: {
        detail:
          'ECONNREFUSED: Could not connect to database at localhost:5432. Is PostgreSQL running?',
      },
      timestamp: offsetToTimestamp(3),
    },
    {
      id: 'er5',
      role: 'assistant',
      type: 'text',
      content:
        'The migration failed because the database is not running. ' +
        'Start PostgreSQL with `brew services start postgresql` and try again.',
      timestamp: offsetToTimestamp(4),
    },
  ];
}

export function makeRateLimitEvent(): Message[] {
  return [
    {
      id: 'rl1',
      role: 'user',
      type: 'text',
      content: 'Refactor all test files to use vitest',
      timestamp: offsetToTimestamp(0),
    },
    {
      id: 'rl2',
      role: 'assistant',
      type: 'text',
      content: "I'll start converting the test files from Jest to Vitest.",
      timestamp: offsetToTimestamp(1),
    },
    {
      id: 'rl3',
      role: 'system',
      type: 'rate_limit_event',
      content: 'Rate limit reached. Waiting 45 seconds before retrying...',
      meta: { retryAfterMs: 45000 },
      timestamp: offsetToTimestamp(2),
    },
    {
      id: 'rl4',
      role: 'assistant',
      type: 'text',
      content: 'Continuing the migration. Converting `auth.test.ts` next.',
      timestamp: offsetToTimestamp(3),
    },
  ];
}

export function makeCompactBoundary(): Message[] {
  return [
    {
      id: 'cb1',
      role: 'user',
      type: 'text',
      content: 'Help me debug the auth flow',
      timestamp: offsetToTimestamp(0),
    },
    {
      id: 'cb2',
      role: 'assistant',
      type: 'text',
      content: 'I traced the issue to the token refresh logic.',
      timestamp: offsetToTimestamp(1),
    },
    {
      id: 'cb3',
      role: 'system',
      type: 'compact_boundary',
      content: '',
      timestamp: offsetToTimestamp(2),
    },
    {
      id: 'cb4',
      role: 'assistant',
      type: 'text',
      content:
        'After reviewing the earlier context, the root cause is in `refreshToken()` — ' +
        'it does not handle expired refresh tokens gracefully.',
      timestamp: offsetToTimestamp(3),
    },
  ];
}

export function makeInterrupt(): Message[] {
  return [
    {
      id: 'int1',
      role: 'user',
      type: 'text',
      content: 'Analyze all 200 test files',
      timestamp: offsetToTimestamp(0),
    },
    {
      id: 'int2',
      role: 'assistant',
      type: 'text',
      content: "I'll start scanning all test files in the project.",
      timestamp: offsetToTimestamp(1),
    },
    {
      id: 'int3',
      role: 'assistant',
      type: 'tool_use',
      content: 'Bash',
      meta: { toolId: 'int-t1', input: { command: 'find . -name "*.test.ts" | head -50' } },
      timestamp: offsetToTimestamp(2),
    },
    { id: 'int4', role: 'system', type: 'interrupt', content: '', timestamp: offsetToTimestamp(3) },
    {
      id: 'int5',
      role: 'user',
      type: 'text',
      content: 'Actually, just focus on the auth tests',
      timestamp: offsetToTimestamp(4),
    },
    {
      id: 'int6',
      role: 'assistant',
      type: 'text',
      content: "Sure, I'll narrow the scope to `src/auth/__tests__/` only.",
      timestamp: offsetToTimestamp(5),
    },
  ];
}

export function makeThinkingBlock(): Message[] {
  return [
    {
      id: 'tb1',
      role: 'user',
      type: 'text',
      content: 'What is the best approach for caching API responses?',
      timestamp: offsetToTimestamp(0),
    },
    {
      id: 'tb2',
      role: 'assistant',
      type: 'thinking',
      content:
        'Let me consider the tradeoffs between different caching strategies:\n\n' +
        '1. In-memory cache (Map/WeakMap) — fast, but lost on restart\n' +
        '2. Redis — shared across instances, TTL support, but adds infra\n' +
        '3. HTTP cache headers — client-side, no server work, but less control\n\n' +
        'Given this is a single-server Node app, in-memory with TTL is simplest.',
      meta: { budget_tokens: 1024, durationMs: 3200 },
      timestamp: offsetToTimestamp(1),
    },
    {
      id: 'tb3',
      role: 'assistant',
      type: 'text',
      content:
        'For a single-server setup, I recommend an **in-memory cache with TTL**. ' +
        'Use a `Map` with expiry tracking — no external dependencies, sub-millisecond lookups, ' +
        'and you can add Redis later if you scale to multiple instances.',
      timestamp: offsetToTimestamp(2),
    },
  ];
}

// ── Advanced fixtures ──

export function makeMultiToolChainAdvanced(): Message[] {
  return [
    {
      id: 'mt1',
      role: 'user',
      type: 'text',
      content: 'Find all TODO comments and create a summary report',
      timestamp: offsetToTimestamp(0),
    },
    {
      id: 'mt2',
      role: 'assistant',
      type: 'text',
      content: "I'll search for TODOs across the codebase and compile a report.",
      timestamp: offsetToTimestamp(1),
    },
    {
      id: 'mt3',
      role: 'assistant',
      type: 'tool_use',
      content: 'Bash',
      meta: { toolId: 'mt-t1', input: { command: 'grep -rn "TODO" src/ --include="*.ts"' } },
      timestamp: offsetToTimestamp(2),
    },
    {
      id: 'mt4',
      role: 'assistant',
      type: 'tool_result',
      content:
        'src/auth/login.ts:45: // TODO: add rate limiting\n' +
        'src/auth/session.ts:12: // TODO: implement refresh token rotation\n' +
        'src/db/migrate.ts:78: // TODO: add rollback support\n' +
        'src/api/users.ts:23: // TODO: validate email format\n' +
        'src/api/users.ts:89: // TODO: paginate results',
      meta: { toolId: 'mt-t1', name: 'Bash' },
      timestamp: offsetToTimestamp(3),
    },
    {
      id: 'mt5',
      role: 'assistant',
      type: 'tool_use',
      content: 'Read',
      meta: { toolId: 'mt-t2', input: { file_path: '/src/auth/login.ts' } },
      timestamp: offsetToTimestamp(4),
    },
    {
      id: 'mt6',
      role: 'assistant',
      type: 'tool_result',
      content:
        '43: async function attemptLogin(email, password) {\n44:   const attempts = await getAttempts(email);\n45:   // TODO: add rate limiting\n46:   if (attempts > 5) throw new Error("Too many attempts");\n47: }',
      meta: { toolId: 'mt-t2', name: 'Read' },
      timestamp: offsetToTimestamp(5),
    },
    {
      id: 'mt7',
      role: 'assistant',
      type: 'tool_use',
      content: 'Write',
      meta: { toolId: 'mt-t3', input: { file_path: '/docs/TODO-report.md' } },
      timestamp: offsetToTimestamp(6),
    },
    {
      id: 'mt8',
      role: 'assistant',
      type: 'tool_result',
      content: 'File written: /docs/TODO-report.md',
      meta: { toolId: 'mt-t3', name: 'Write' },
      timestamp: offsetToTimestamp(7),
    },
    {
      id: 'mt9',
      role: 'assistant',
      type: 'text',
      content:
        'Found **5 TODOs** across 4 files. Created `/docs/TODO-report.md` with the full summary.\n\n' +
        '| Priority | File | Line | Description |\n' +
        '|----------|------|------|-------------|\n' +
        '| High | auth/login.ts | 45 | Add rate limiting |\n' +
        '| High | auth/session.ts | 12 | Implement refresh token rotation |\n' +
        '| Medium | db/migrate.ts | 78 | Add rollback support |\n' +
        '| Low | api/users.ts | 23 | Validate email format |\n' +
        '| Low | api/users.ts | 89 | Paginate results |',
      timestamp: offsetToTimestamp(8),
    },
  ];
}

export function makeStreamlinedOutput(): Message[] {
  return [
    {
      id: 'so1',
      role: 'user',
      type: 'text',
      content: 'Install and configure ESLint',
      timestamp: offsetToTimestamp(0),
    },
    {
      id: 'so2',
      role: 'assistant',
      type: 'streamlined_text',
      content: 'Installing ESLint and related packages...',
      timestamp: offsetToTimestamp(1),
    },
    {
      id: 'so3',
      role: 'assistant',
      type: 'streamlined_tool_use_summary',
      content:
        'Ran Bash: npm install eslint @typescript-eslint/parser\nRan Write: .eslintrc.json\nRan Write: .eslintignore',
      timestamp: offsetToTimestamp(2),
    },
    {
      id: 'so4',
      role: 'assistant',
      type: 'text',
      content:
        'ESLint is configured with TypeScript support. Created `.eslintrc.json` with recommended rules ' +
        'and `.eslintignore` to skip `node_modules` and `dist`.',
      timestamp: offsetToTimestamp(3),
    },
  ];
}

export function makeTaskStarted(): Message[] {
  return [
    {
      id: 'ts1',
      role: 'user',
      type: 'text',
      content: 'Refactor the auth module into smaller files',
      timestamp: offsetToTimestamp(0),
    },
    {
      id: 'ts2',
      role: 'assistant',
      type: 'task_started',
      content: 'Refactor auth module',
      meta: { taskId: 'task-1' },
      timestamp: offsetToTimestamp(1),
    },
    {
      id: 'ts3',
      role: 'assistant',
      type: 'tool_use',
      content: 'Read',
      meta: { toolId: 'ts-t1', input: { file_path: '/src/auth/index.ts' } },
      timestamp: offsetToTimestamp(2),
    },
    {
      id: 'ts4',
      role: 'assistant',
      type: 'tool_result',
      content:
        'export { login } from "./login";\nexport { logout } from "./logout";\nexport { refreshToken } from "./refresh";',
      meta: { toolId: 'ts-t1', name: 'Read' },
      timestamp: offsetToTimestamp(3),
    },
    {
      id: 'ts5',
      role: 'assistant',
      type: 'text',
      content:
        'Split `auth/index.ts` into three focused modules: `login.ts`, `logout.ts`, and `refresh.ts`.',
      timestamp: offsetToTimestamp(4),
    },
  ];
}

export function makeHookExecution(): Message[] {
  return [
    {
      id: 'he1',
      role: 'user',
      type: 'text',
      content: 'Commit the changes',
      timestamp: offsetToTimestamp(0),
    },
    {
      id: 'he2',
      role: 'assistant',
      type: 'tool_use',
      content: 'Bash',
      meta: { toolId: 'he-t1', input: { command: 'git commit -m "refactor: split auth module"' } },
      timestamp: offsetToTimestamp(1),
    },
    {
      id: 'he3',
      role: 'system',
      type: 'hook_started',
      content: 'pre-commit',
      meta: { hookName: 'pre-commit' },
      timestamp: offsetToTimestamp(2),
    },
    {
      id: 'he4',
      role: 'system',
      type: 'hook_response',
      content: 'All checks passed',
      meta: { hookName: 'pre-commit', exitCode: 0 },
      timestamp: offsetToTimestamp(3),
    },
    {
      id: 'he5',
      role: 'assistant',
      type: 'tool_result',
      content:
        '[main abc1234] refactor: split auth module\n 3 files changed, 45 insertions(+), 120 deletions(-)',
      meta: { toolId: 'he-t1', name: 'Bash' },
      timestamp: offsetToTimestamp(4),
    },
    {
      id: 'he6',
      role: 'assistant',
      type: 'text',
      content: 'Committed successfully. The pre-commit hook (lint + typecheck) passed.',
      timestamp: offsetToTimestamp(5),
    },
  ];
}

// ── Session fixtures ──

export function makeDisconnectedSession(): Message[] {
  return [
    {
      id: 'ds1',
      role: 'user',
      type: 'text',
      content: 'List all files in src/',
      timestamp: offsetToTimestamp(0),
    },
    {
      id: 'ds2',
      role: 'assistant',
      type: 'text',
      content: "I'll list the directory contents for you.",
      timestamp: offsetToTimestamp(1),
    },
    {
      id: 'ds3',
      role: 'system',
      type: 'error',
      content: 'Connection lost',
      meta: { detail: 'WebSocket connection closed unexpectedly. Attempting to reconnect...' },
      timestamp: offsetToTimestamp(2),
    },
  ];
}
