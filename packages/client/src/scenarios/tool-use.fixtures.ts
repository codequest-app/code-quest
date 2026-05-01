import { segments as s } from '@code-quest/summoner/test';
import { buildChannelState } from '../test/build-channel-state';
import type { ChannelState } from '../types/chat';

export const readAndGrepState: Partial<ChannelState> = buildChannelState([
  s.user('Find where the login function is defined and show me the code'),
  s.assistant("I'll search for the login function first."),
  s.assistant({
    toolUse: {
      id: 'rg-t1',
      name: 'Grep',
      input: { pattern: 'export function login', include: '**/*.ts' },
    },
  }),
  s.toolResult(
    'rg-t1',
    'src/auth/login.ts:15:export function login(email: string, password: string): Promise<Session>',
  ),
  s.assistant('Found it in `src/auth/login.ts`. Let me read the full file.'),
  s.assistant({
    toolUse: { id: 'rg-t2', name: 'Read', input: { file_path: '/src/auth/login.ts' } },
  }),
  s.toolResult(
    'rg-t2',
    'import { hash } from "../utils/crypto";\nimport { db } from "../db";\n\ninterface Session {\n  token: string;\n  userId: string;\n  expiresAt: Date;\n}\n\nexport async function login(\n  email: string,\n  password: string,\n): Promise<Session> {\n  const user = await db.users.findByEmail(email);\n  if (!user) throw new Error("User not found");\n\n  const valid = await hash.verify(password, user.passwordHash);\n  if (!valid) throw new Error("Invalid password");\n\n  return db.sessions.create({ userId: user.id });\n}\n',
  ),
  s.assistant(
    'The `login` function is in `src/auth/login.ts` (line 15). It:\n\n1. Looks up the user by email\n2. Verifies the password hash\n3. Creates and returns a new session\n\nIt throws on invalid credentials rather than returning null.',
  ),
  s.result(),
]);

export const bashExecutionState: Partial<ChannelState> = buildChannelState([
  s.user('Run the tests and show me the results'),
  s.assistant("I'll run the test suite."),
  s.assistant({
    toolUse: { id: 'be-t1', name: 'Bash', input: { command: 'pnpm test --reporter=verbose' } },
  }),
  s.toolResult(
    'be-t1',
    ' ✓ src/auth/login.test.ts (3 tests) 12ms\n   ✓ login with valid credentials returns session\n   ✓ login with wrong password throws\n   ✓ login with unknown email throws\n ✓ src/utils/crypto.test.ts (2 tests) 8ms\n   ✓ hash produces consistent output\n   ✓ verify rejects wrong input\n ✗ src/db/migrations.test.ts (1 test) 45ms\n   ✗ migration 003 adds index on email\n     → Expected index "idx_users_email" to exist\n\n Test Files  2 passed | 1 failed (3)\n      Tests  5 passed | 1 failed (6)\n   Duration  1.23s',
  ),
  s.assistant(
    "5 of 6 tests pass. There's **1 failure** in `src/db/migrations.test.ts`:\n\n> migration 003 expects an index `idx_users_email` that doesn't exist yet.\n\nThis likely means the migration hasn't been applied. Want me to fix it?",
  ),
  s.result(),
]);

export const editWithDiffState: Partial<ChannelState> = buildChannelState([
  s.user('Add null-check for the user parameter in the login function'),
  s.assistant("I'll add an early return for null/undefined user input."),
  s.assistant({
    toolUse: { id: 'ed-t1', name: 'Edit', input: { file_path: '/src/auth/login.ts' } },
  }),
  s.toolResult(
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
  s.assistant(
    'Added a guard clause at the top of `login()` that throws if `email` or `password` is falsy. ' +
      'This prevents the function from hitting the database with invalid input.',
  ),
]);

export const longConversationState: Partial<ChannelState> = buildChannelState([
  s.user('Fix the login bug'),
  s.thinking('Looking at the authentication logic to identify the issue…'),
  s.assistant("I'll start by reading the auth module."),
  s.assistant({ toolUse: { id: 't1', name: 'Read', input: { file_path: '/src/auth.ts' } } }),
  s.toolResult('t1', 'export function login(user, password) {\n  /* ... */\n}'),
  s.assistant({ toolUse: { id: 't2', name: 'Grep', input: { pattern: 'validateUser' } } }),
  s.toolResult('t2', 'src/auth.ts:42:  const ok = validateUser(user, password);'),
  s.assistant('Found it — `validateUser` has a null-safety bug on line 42.'),
  s.user('Please fix it and add a test.'),
  s.assistant({ toolUse: { id: 't3', name: 'Edit', input: { file_path: '/src/auth.ts' } } }),
  s.toolResult(
    't3',
    '--- a/src/auth.ts\n+++ b/src/auth.ts\n@@ -40,4 +40,5 @@\n export function login(user, password) {\n-  const ok = validateUser(user, password);\n+  if (!user) return false;\n+  const ok = validateUser(user, password);\n   return ok;\n }',
  ),
  s.assistant({ toolUse: { id: 't4', name: 'Write', input: { file_path: '/src/auth.test.ts' } } }),
  s.toolResult('t4', 'File created: /src/auth.test.ts'),
  s.assistant({ toolUse: { id: 't5', name: 'Bash', input: { command: 'pnpm test auth' } } }),
  s.toolResult('t5', 'PASS src/auth.test.ts (3 tests, 12ms)'),
  s.assistant('All 3 tests pass. The null-safety fix is in place.'),
  s.user('Commit with a good message.'),
  s.assistant({
    toolUse: {
      id: 't6',
      name: 'Bash',
      input: { command: 'git commit -am "fix(auth): null-check user before validate"' },
    },
  }),
  s.toolResult('t6', '[main abc1234] fix(auth): null-check user before validate'),
  s.assistant('Done. Committed as `abc1234`.'),
  s.result({ durationMs: 12_345, costUsd: 0.0234 }),
]);
