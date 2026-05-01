import type { PendingControl, SessionStateSummary } from '@code-quest/shared';
import { segments } from '@code-quest/summoner/test-browser';
import type { ChannelState } from '../types/chat';
import type { Message } from '../types/ui';
import { buildChannelState } from './build-channel-state';
import { STORY_CHANNEL_ID } from './story-decorator';

const STORY_WORKTREE_CHANNEL_ID = 'story-worktree';
const STORY_PROJECT_ROOT = '/Users/demo/cc-office';

export function makeLongConversation(): Partial<ChannelState> {
  return buildChannelState([
    segments.init('s1'),
    segments.user('Fix the login bug'),
    segments.thinking('Looking at the authentication logic to identify the issue…'),
    segments.assistant("I'll start by reading the auth module."),
    segments.assistant({
      toolUse: { id: 't1', name: 'Read', input: { file_path: '/src/auth.ts' } },
    }),
    segments.toolResult('t1', 'export function login(user, password) {\n  /* ... */\n}'),
    segments.assistant({ toolUse: { id: 't2', name: 'Grep', input: { pattern: 'validateUser' } } }),
    segments.toolResult('t2', 'src/auth.ts:42:  const ok = validateUser(user, password);'),
    segments.assistant('Found it — `validateUser` has a null-safety bug on line 42.'),
    segments.user('Please fix it and add a test.'),
    segments.assistant({
      toolUse: { id: 't3', name: 'Edit', input: { file_path: '/src/auth.ts' } },
    }),
    segments.toolResult(
      't3',
      '--- a/src/auth.ts\n+++ b/src/auth.ts\n@@ -40,4 +40,5 @@\n export function login(user, password) {\n-  const ok = validateUser(user, password);\n+  if (!user) return false;\n+  const ok = validateUser(user, password);\n   return ok;\n }',
    ),
    segments.assistant({
      toolUse: { id: 't4', name: 'Write', input: { file_path: '/src/auth.test.ts' } },
    }),
    segments.toolResult('t4', 'File created: /src/auth.test.ts'),
    segments.assistant({
      toolUse: { id: 't5', name: 'Bash', input: { command: 'pnpm test auth' } },
    }),
    segments.toolResult('t5', 'PASS src/auth.test.ts (3 tests, 12ms)'),
    segments.assistant('All 3 tests pass. The null-safety fix is in place.'),
    segments.user('Commit with a good message.'),
    segments.assistant({
      toolUse: {
        id: 't6',
        name: 'Bash',
        input: { command: 'git commit -am "fix(auth): null-check user before validate"' },
      },
    }),
    segments.toolResult('t6', '[main abc1234] fix(auth): null-check user before validate'),
    segments.assistant('Done. Committed as `abc1234`.'),
    segments.result(),
  ]);
}

export function makeProcessingWithTool(): Partial<ChannelState> {
  return buildChannelState([
    segments.init('s1'),
    segments.user('Search for TODO comments'),
    segments.assistant("I'll use Grep to find them."),
    segments.assistant({
      toolUse: { id: 'tp1', name: 'Grep', input: { pattern: 'TODO', glob: '**/*.ts' } },
    }),
  ]);
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

function makePermissionFlow(opts: {
  idPrefix: string;
  userContent: string;
  assistantContent: string;
  pendingToolName: string;
  requestId: string;
  pendingInput: Record<string, unknown>;
  pendingSubtype: PendingControl['subtype'];
}): { messages: Message[]; pending: PendingControl[] } {
  return {
    messages: [
      {
        id: `${opts.idPrefix}1`,
        role: 'user',
        type: 'text',
        content: opts.userContent,
        timestamp: 1_700_000_000_000,
      },
      {
        id: `${opts.idPrefix}2`,
        role: 'assistant',
        type: 'text',
        content: opts.assistantContent,
        timestamp: 1_700_001_000_000,
      },
      {
        id: `${opts.idPrefix}3`,
        role: 'assistant',
        type: 'pending_action',
        content: opts.pendingToolName,
        meta: { requestId: opts.requestId, input: opts.pendingInput },
        timestamp: 1_700_002_000_000,
      },
    ],
    pending: [
      {
        requestId: opts.requestId,
        subtype: opts.pendingSubtype,
        toolName: opts.pendingToolName,
        input: opts.pendingInput,
      },
    ],
  };
}

export function makeToolApprovalFlow(): { messages: Message[]; pending: PendingControl[] } {
  return makePermissionFlow({
    idPrefix: 'ta',
    userContent: 'Clean up the build artifacts',
    assistantContent: "I'll remove the build directory to start fresh.",
    pendingToolName: 'Bash',
    requestId: 'req-1',
    pendingInput: {
      command: 'rm -rf /tmp/build',
      description: 'Clean build artifacts before rebuilding',
    },
    pendingSubtype: 'can_use_tool',
  });
}

export function makeToolDenialFlow(): { messages: Message[]; pending: PendingControl[] } {
  return makePermissionFlow({
    idPrefix: 'td',
    userContent: 'Delete all log files',
    assistantContent: "I'll remove the log files.",
    pendingToolName: 'Bash',
    requestId: 'req-deny',
    pendingInput: {
      command: 'rm -rf /var/log/app/*',
      description: 'Remove all application log files',
    },
    pendingSubtype: 'can_use_tool',
  });
}

export function makePlanReviewFlow(): { messages: Message[]; pending: PendingControl[] } {
  return makePermissionFlow({
    idPrefix: 'pr',
    userContent: 'Refactor the auth module',
    assistantContent:
      "Here's my plan:\n\n" +
      '1. Extract `validateUser` into its own module\n' +
      '2. Add proper error types\n' +
      '3. Update tests\n\n' +
      'Shall I proceed?',
    pendingToolName: 'ExitPlanMode',
    requestId: 'req-plan',
    pendingInput: {},
    pendingSubtype: 'exit_plan_mode',
  });
}

// ── Scenario fixtures ──

export function makeSimpleQA(): Partial<ChannelState> {
  return buildChannelState([
    segments.init('s1'),
    segments.user('What does this project do?'),
    segments.assistant(
      'This is a **chat interface** for Claude Code. It provides:\n\n' +
        '- Real-time conversation with Claude\n' +
        '- Tool execution (Bash, Read, Edit, etc.)\n' +
        '- Permission management for tool approval\n' +
        '- Session history and context management\n\n' +
        'The frontend is built with React + Tailwind, communicating with a Node.js backend via WebSocket.',
    ),
    segments.result(),
  ]);
}

export function makeReadAndGrep(): Partial<ChannelState> {
  return buildChannelState([
    segments.init('s1'),
    segments.user('Find where the login function is defined and show me the code'),
    segments.assistant("I'll search for the login function first."),
    segments.assistant({
      toolUse: {
        id: 'rg-t1',
        name: 'Grep',
        input: { pattern: 'export function login', include: '**/*.ts' },
      },
    }),
    segments.toolResult(
      'rg-t1',
      'src/auth/login.ts:15:export function login(email: string, password: string): Promise<Session>',
    ),
    segments.assistant('Found it in `src/auth/login.ts`. Let me read the full file.'),
    segments.assistant({
      toolUse: { id: 'rg-t2', name: 'Read', input: { file_path: '/src/auth/login.ts' } },
    }),
    segments.toolResult(
      'rg-t2',
      'import { hash } from "../utils/crypto";\nimport { db } from "../db";\n\n' +
        'interface Session {\n  token: string;\n  userId: string;\n  expiresAt: Date;\n}\n\n' +
        'export async function login(\n  email: string,\n  password: string,\n): Promise<Session> {\n' +
        '  const user = await db.users.findByEmail(email);\n' +
        '  if (!user) throw new Error("User not found");\n\n' +
        '  const valid = await hash.verify(password, user.passwordHash);\n' +
        '  if (!valid) throw new Error("Invalid password");\n\n' +
        '  return db.sessions.create({ userId: user.id });\n}\n',
    ),
    segments.assistant(
      'The `login` function is in `src/auth/login.ts` (line 15). It:\n\n' +
        '1. Looks up the user by email\n' +
        '2. Verifies the password hash\n' +
        '3. Creates and returns a new session\n\n' +
        'It throws on invalid credentials rather than returning null.',
    ),
    segments.result(),
  ]);
}

export function makeBashExecution(): Partial<ChannelState> {
  return buildChannelState([
    segments.init('s1'),
    segments.user('Run the tests and show me the results'),
    segments.assistant("I'll run the test suite."),
    segments.assistant({
      toolUse: { id: 'be-t1', name: 'Bash', input: { command: 'pnpm test --reporter=verbose' } },
    }),
    segments.toolResult(
      'be-t1',
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
    ),
    segments.assistant(
      "5 of 6 tests pass. There's **1 failure** in `src/db/migrations.test.ts`:\n\n" +
        "> migration 003 expects an index `idx_users_email` that doesn't exist yet.\n\n" +
        "This likely means the migration hasn't been applied. Want me to fix it?",
    ),
    segments.result(),
  ]);
}

export function makeEditWithDiff(): Partial<ChannelState> {
  return buildChannelState([
    segments.init('s1'),
    segments.user('Add null-check for the user parameter in the login function'),
    segments.assistant("I'll add an early return for null/undefined user input."),
    segments.assistant({
      toolUse: { id: 'ed-t1', name: 'Edit', input: { file_path: '/src/auth/login.ts' } },
    }),
    segments.toolResult(
      'ed-t1',
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
    ),
    segments.assistant(
      'Added a guard clause at the top of `login()` that throws if `email` or `password` is falsy. ' +
        'This prevents the function from hitting the database with invalid input.',
    ),
    segments.result(),
  ]);
}

// ── System Events fixtures ──

export function makeErrorRecovery(): Partial<ChannelState> {
  return buildChannelState([
    segments.init('s1'),
    segments.user('Run the migration script'),
    segments.assistant("I'll execute the migration now."),
    segments.assistant({
      toolUse: { id: 'er-t1', name: 'Bash', input: { command: 'npm run migrate' } },
    }),
    segments.error(
      'ECONNREFUSED: Could not connect to database at localhost:5432. Is PostgreSQL running?',
    ),
    segments.assistant(
      'The migration failed because the database is not running. ' +
        'Start PostgreSQL with `brew services start postgresql` and try again.',
    ),
    segments.result(),
  ]);
}

export function makeRateLimitEvent(): Partial<ChannelState> {
  return buildChannelState([
    segments.init('s1'),
    segments.user('Refactor all test files to use vitest'),
    segments.assistant("I'll start converting the test files from Jest to Vitest."),
    segments.rateLimitEvent(),
    segments.assistant('Continuing the migration. Converting `auth.test.ts` next.'),
    segments.result(),
  ]);
}

export function makeCompactBoundary(): Partial<ChannelState> {
  return buildChannelState([
    segments.init('s1'),
    segments.user('Help me debug the auth flow'),
    segments.assistant('I traced the issue to the token refresh logic.'),
    segments.compactBoundary(),
    segments.assistant(
      'After reviewing the earlier context, the root cause is in `refreshToken()` — ' +
        'it does not handle expired refresh tokens gracefully.',
    ),
    segments.result(),
  ]);
}

export function makeInterrupt(): Partial<ChannelState> {
  return buildChannelState([
    segments.init('s1'),
    segments.user('Analyze all 200 test files'),
    segments.assistant("I'll start scanning all test files in the project."),
    segments.assistant({
      toolUse: {
        id: 'int-t1',
        name: 'Bash',
        input: { command: 'find . -name "*.test.ts" | head -50' },
      },
    }),
    segments.controlCancelRequest('req-cancel-1'),
    segments.user('Actually, just focus on the auth tests'),
    segments.assistant("Sure, I'll narrow the scope to `src/auth/__tests__/` only."),
    segments.result(),
  ]);
}

export function makeThinkingBlock(): Partial<ChannelState> {
  return buildChannelState([
    segments.init('s1'),
    segments.user('What is the best approach for caching API responses?'),
    segments.thinking(
      'Let me consider the tradeoffs between different caching strategies:\n\n' +
        '1. In-memory cache (Map/WeakMap) — fast, but lost on restart\n' +
        '2. Redis — shared across instances, TTL support, but adds infra\n' +
        '3. HTTP cache headers — client-side, no server work, but less control\n\n' +
        'Given this is a single-server Node app, in-memory with TTL is simplest.',
    ),
    segments.assistant(
      'For a single-server setup, I recommend an **in-memory cache with TTL**. ' +
        'Use a `Map` with expiry tracking — no external dependencies, sub-millisecond lookups, ' +
        'and you can add Redis later if you scale to multiple instances.',
    ),
    segments.result(),
  ]);
}

// ── Advanced fixtures ──

export function makeMultiToolChainAdvanced(): Partial<ChannelState> {
  return buildChannelState([
    segments.init('s1'),
    segments.user('Find all TODO comments and create a summary report'),
    segments.assistant("I'll search for TODOs across the codebase and compile a report."),
    segments.assistant({
      toolUse: {
        id: 'mt-t1',
        name: 'Bash',
        input: { command: 'grep -rn "TODO" src/ --include="*.ts"' },
      },
    }),
    segments.toolResult(
      'mt-t1',
      'src/auth/login.ts:45: // TODO: add rate limiting\n' +
        'src/auth/session.ts:12: // TODO: implement refresh token rotation\n' +
        'src/db/migrate.ts:78: // TODO: add rollback support\n' +
        'src/api/users.ts:23: // TODO: validate email format\n' +
        'src/api/users.ts:89: // TODO: paginate results',
    ),
    segments.assistant({
      toolUse: { id: 'mt-t2', name: 'Read', input: { file_path: '/src/auth/login.ts' } },
    }),
    segments.toolResult(
      'mt-t2',
      '43: async function attemptLogin(email, password) {\n44:   const attempts = await getAttempts(email);\n45:   // TODO: add rate limiting\n46:   if (attempts > 5) throw new Error("Too many attempts");\n47: }',
    ),
    segments.assistant({
      toolUse: { id: 'mt-t3', name: 'Write', input: { file_path: '/docs/TODO-report.md' } },
    }),
    segments.toolResult('mt-t3', 'File written: /docs/TODO-report.md'),
    segments.assistant(
      'Found **5 TODOs** across 4 files. Created `/docs/TODO-report.md` with the full summary.\n\n' +
        '| Priority | File | Line | Description |\n' +
        '|----------|------|------|-------------|\n' +
        '| High | auth/login.ts | 45 | Add rate limiting |\n' +
        '| High | auth/session.ts | 12 | Implement refresh token rotation |\n' +
        '| Medium | db/migrate.ts | 78 | Add rollback support |\n' +
        '| Low | api/users.ts | 23 | Validate email format |\n' +
        '| Low | api/users.ts | 89 | Paginate results |',
    ),
    segments.result(),
  ]);
}

export function makeStreamlinedOutput(): Partial<ChannelState> {
  return buildChannelState([
    segments.init('s1'),
    segments.user('Install and configure ESLint'),
    segments.streamlinedText('Installing ESLint and related packages...'),
    segments.streamlinedToolUseSummary(
      'Ran Bash: npm install eslint @typescript-eslint/parser\nRan Write: .eslintrc.json\nRan Write: .eslintignore',
    ),
    segments.assistant(
      'ESLint is configured with TypeScript support. Created `.eslintrc.json` with recommended rules ' +
        'and `.eslintignore` to skip `node_modules` and `dist`.',
    ),
    segments.result(),
  ]);
}

export function makeTaskStarted(): Partial<ChannelState> {
  return buildChannelState([
    segments.init('s1'),
    segments.user('Refactor the auth module into smaller files'),
    segments.taskStarted('ts-t1', 'Refactor auth module'),
    segments.assistant({
      toolUse: { id: 'ts-t1', name: 'Read', input: { file_path: '/src/auth/index.ts' } },
    }),
    segments.toolResult(
      'ts-t1',
      'export { login } from "./login";\nexport { logout } from "./logout";\nexport { refreshToken } from "./refresh";',
    ),
    segments.assistant(
      'Split `auth/index.ts` into three focused modules: `login.ts`, `logout.ts`, and `refresh.ts`.',
    ),
    segments.result(),
  ]);
}

export function makeHookExecution(): Partial<ChannelState> {
  return buildChannelState([
    segments.init('s1'),
    segments.user('Commit the changes'),
    segments.assistant({
      toolUse: {
        id: 'he-t1',
        name: 'Bash',
        input: { command: 'git commit -m "refactor: split auth module"' },
      },
    }),
    segments.hookStarted('hook-1', 'pre-commit', 'PostToolUse'),
    segments.hookResponse('hook-1', 'pre-commit', 'PostToolUse', 'All checks passed'),
    segments.toolResult(
      'he-t1',
      '[main abc1234] refactor: split auth module\n 3 files changed, 45 insertions(+), 120 deletions(-)',
    ),
    segments.assistant('Committed successfully. The pre-commit hook (lint + typecheck) passed.'),
    segments.result(),
  ]);
}

// ── Tool grouping fixtures ──

export function makeHeavyToolUseConversation(): Partial<ChannelState> {
  return buildChannelState([
    segments.init('s1'),
    segments.user('Find all usages of the old API and migrate them to the new one'),
    segments.thinking(
      'I need to find all usages of the deprecated API first, then understand the new API shape before making changes.',
    ),
    segments.assistant({
      toolUse: { id: 'ht-t1', name: 'Grep', input: { pattern: 'oldApi\\(', include: '**/*.ts' } },
    }),
    segments.toolResult('ht-t1', 'src/auth.ts:12\nsrc/users.ts:45\nsrc/api/index.ts:8'),
    segments.assistant({
      toolUse: { id: 'ht-t2', name: 'Read', input: { file_path: '/src/auth.ts' } },
    }),
    segments.toolResult('ht-t2', 'import { oldApi } from "../lib";\n\noldApi({ user, token });'),
    segments.assistant({
      toolUse: { id: 'ht-t3', name: 'Read', input: { file_path: '/src/users.ts' } },
    }),
    segments.toolResult('ht-t3', 'const result = oldApi({ userId: id });'),
    segments.assistant({
      toolUse: { id: 'ht-t4', name: 'Read', input: { file_path: '/src/api/index.ts' } },
    }),
    segments.toolResult('ht-t4', 'export const handler = (req) => oldApi(req.params);'),
    segments.thinking(
      'I have read all usages. The new API uses a different signature: newApi({ context, payload }). I need to transform each call accordingly.',
    ),
    segments.assistant({
      toolUse: { id: 'ht-t5', name: 'Edit', input: { file_path: '/src/auth.ts' } },
    }),
    segments.toolResult(
      'ht-t5',
      '-oldApi({ user, token });\n+newApi({ context: { user }, payload: { token } });',
    ),
    segments.assistant({
      toolUse: { id: 'ht-t6', name: 'Edit', input: { file_path: '/src/users.ts' } },
    }),
    segments.toolResult(
      'ht-t6',
      '-const result = oldApi({ userId: id });\n+const result = newApi({ context: {}, payload: { userId: id } });',
    ),
    segments.assistant({
      toolUse: { id: 'ht-t7', name: 'Edit', input: { file_path: '/src/api/index.ts' } },
    }),
    segments.toolResult(
      'ht-t7',
      '-export const handler = (req) => oldApi(req.params);\n+export const handler = (req) => newApi({ context: req, payload: req.params });',
    ),
    segments.assistant({
      toolUse: { id: 'ht-t8', name: 'Bash', input: { command: 'npx tsc --noEmit' } },
    }),
    segments.toolResult('ht-t8', ''),
    segments.assistant(
      'Migrated all 3 usages from `oldApi` to `newApi`. TypeScript is happy — no errors.',
    ),
    segments.result(),
  ]);
}

export function makeSkillInvocationConversation(): Partial<ChannelState> {
  return buildChannelState([
    segments.init('s1'),
    segments.user('Validate this Zod schema and suggest improvements'),
    segments.thinking('I will use the zod-validation skill to check this.'),
    segments.assistant({
      toolUse: { id: 'sk-t1', name: 'Read', input: { file_path: '/src/schemas.ts' } },
    }),
    segments.toolResult(
      'sk-t1',
      'export const userSchema = z.object({ name: z.string(), age: z.number() });',
    ),
    segments.assistant({
      toolUse: { id: 'sk-t2', name: 'Skill', input: { skill: 'zod-validation' } },
    }),
    segments.toolResult('sk-t2', 'Schema validated: add .min(0) to age, consider .trim() on name.'),
    segments.assistant(
      'The schema looks good. Two suggestions: add `.min(0)` to `age` and `.trim()` to `name`.',
    ),
    segments.result(),
  ]);
}

// ── Session fixtures ──

export function makeDisconnectedSession(): Partial<ChannelState> {
  return buildChannelState([
    segments.init('s1'),
    segments.user('List all files in src/'),
    segments.assistant("I'll list the directory contents for you."),
    segments.error('WebSocket connection closed unexpectedly. Attempting to reconnect...'),
  ]);
}

export function makeSubagentRunning(): Partial<ChannelState> {
  return buildChannelState([
    segments.init('s1'),
    segments.user('Analyse protocol.md and find issues'),
    segments.thinking('I will spawn a subagent to analyse the file in detail.'),
    segments.agent('sar-task-1', 'Analyse protocol.md and find issues', {
      subagentType: 'Explore',
    }),
    segments.taskProgress('fake-task-1', {
      toolUseId: 'sar-task-1',
      lastToolName: 'Grep',
    }),
    segments.thinking('The subagent is searching through the protocol file…', {
      parentToolUseId: 'sar-task-1',
    }),
    segments.assistant(
      {
        toolUse: {
          id: 'sar-grep-1',
          name: 'Grep',
          input: { pattern: 'error', path: 'protocol.md' },
        },
      },
      { parentToolUseId: 'sar-task-1' },
    ),
  ]);
}

export function makeSubagentDone(): Partial<ChannelState> {
  return buildChannelState([
    segments.init('s1'),
    segments.user('Analyse protocol.md and find issues'),
    segments.thinking('I will spawn a subagent to analyse the file in detail.'),
    segments.agent('sad-task-1', 'Analyse protocol.md and find issues', {
      subagentType: 'Explore',
    }),
    segments.taskNotification('fake-task-1', {
      toolUseId: 'sad-task-1',
      status: 'completed',
      summary: 'Found 3 issues: missing auth header, stale token check, no rate limiting',
      usage: { input_tokens: 18432, output_tokens: 2048 },
    }),
    segments.assistant(
      'The subagent found 3 issues in protocol.md. I recommend fixing the auth header first.',
    ),
    segments.result(),
  ]);
}
