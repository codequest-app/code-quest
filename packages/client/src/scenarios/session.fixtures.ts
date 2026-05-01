import { segments as s } from '@code-quest/summoner/test';
import { buildChannelState } from '../test/build-channel-state';
import type { ChannelState } from '../types/chat';

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

export const processingWithToolState: Partial<ChannelState> = {
  ...buildChannelState([
    s.user('Search for TODO comments'),
    s.assistant("I'll use Grep to find them."),
    s.assistant({
      toolUse: { id: 'tp1', name: 'Grep', input: { pattern: 'TODO', glob: '**/*.ts' } },
    }),
  ]),
  status: 'processing' as const,
};

export const disconnectedSessionState: Partial<ChannelState> = {
  ...buildChannelState([
    s.user('List all files in src/'),
    s.assistant("I'll list the directory contents for you."),
    s.error('Connection lost'),
  ]),
  status: 'disconnected' as const,
};
