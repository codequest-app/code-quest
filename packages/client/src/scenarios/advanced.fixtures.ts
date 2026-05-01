import { segments as s } from '@code-quest/summoner/test';
import { buildChannelState } from '../test/build-channel-state';
import type { ChannelState } from '../types/chat';

export const thinkingBlockState: Partial<ChannelState> = buildChannelState([
  s.user('What is the best approach for caching API responses?'),
  s.thinking(
    'Let me consider the tradeoffs between different caching strategies:\n\n' +
      '1. In-memory cache (Map/WeakMap) — fast, but lost on restart\n' +
      '2. Redis — shared across instances, TTL support, but adds infra\n' +
      '3. HTTP cache headers — client-side, no server work, but less control\n\n' +
      'Given this is a single-server Node app, in-memory with TTL is simplest.',
  ),
  s.assistant(
    'For a single-server setup, I recommend an **in-memory cache with TTL**. ' +
      'Use a `Map` with expiry tracking — no external dependencies, sub-millisecond lookups, ' +
      'and you can add Redis later if you scale to multiple instances.',
  ),
  s.result(),
]);

export const multiToolChainState: Partial<ChannelState> = buildChannelState([
  s.user('Find all TODO comments and create a summary report'),
  s.assistant("I'll search for TODOs across the codebase and compile a report."),
  s.assistant({
    toolUse: {
      id: 'mt-t1',
      name: 'Bash',
      input: { command: 'grep -rn "TODO" src/ --include="*.ts"' },
    },
  }),
  s.toolResult(
    'mt-t1',
    'src/auth/login.ts:45: // TODO: add rate limiting\n' +
      'src/auth/session.ts:12: // TODO: implement refresh token rotation\n' +
      'src/db/migrate.ts:78: // TODO: add rollback support\n' +
      'src/api/users.ts:23: // TODO: validate email format\n' +
      'src/api/users.ts:89: // TODO: paginate results',
  ),
  s.assistant({
    toolUse: { id: 'mt-t2', name: 'Read', input: { file_path: '/src/auth/login.ts' } },
  }),
  s.toolResult(
    'mt-t2',
    '43: async function attemptLogin(email, password) {\n44:   const attempts = await getAttempts(email);\n45:   // TODO: add rate limiting\n46:   if (attempts > 5) throw new Error("Too many attempts");\n47: }',
  ),
  s.assistant({
    toolUse: { id: 'mt-t3', name: 'Write', input: { file_path: '/docs/TODO-report.md' } },
  }),
  s.toolResult('mt-t3', 'File written: /docs/TODO-report.md'),
  s.assistant(
    'Found **5 TODOs** across 4 files. Created `/docs/TODO-report.md` with the full summary.\n\n' +
      '| Priority | File | Line | Description |\n' +
      '|----------|------|------|-------------|\n' +
      '| High | auth/login.ts | 45 | Add rate limiting |\n' +
      '| High | auth/session.ts | 12 | Implement refresh token rotation |\n' +
      '| Medium | db/migrate.ts | 78 | Add rollback support |\n' +
      '| Low | api/users.ts | 23 | Validate email format |\n' +
      '| Low | api/users.ts | 89 | Paginate results |',
  ),
  s.result(),
]);

export const streamlinedOutputState: Partial<ChannelState> = buildChannelState([
  s.user('Install and configure ESLint'),
  s.streamlinedText('Installing ESLint and related packages...'),
  s.streamlinedToolUseSummary(
    'Ran Bash: npm install eslint @typescript-eslint/parser\nRan Write: .eslintrc.json\nRan Write: .eslintignore',
  ),
  s.assistant(
    'ESLint is configured with TypeScript support. Created `.eslintrc.json` with recommended rules ' +
      'and `.eslintignore` to skip `node_modules` and `dist`.',
  ),
  s.result(),
]);

export const taskStartedState: Partial<ChannelState> = buildChannelState([
  s.user('Refactor the auth module into smaller files'),
  s.agent('task-1', 'Refactor auth module', { subagentType: 'code' }),
  s.taskStarted('task-1', 'Refactor auth module'),
  s.assistant({
    toolUse: { id: 'ts-t1', name: 'Read', input: { file_path: '/src/auth/index.ts' } },
  }),
  s.toolResult(
    'ts-t1',
    'export { login } from "./login";\nexport { logout } from "./logout";\nexport { refreshToken } from "./refresh";',
  ),
  s.assistant(
    'Split `auth/index.ts` into three focused modules: `login.ts`, `logout.ts`, and `refresh.ts`.',
  ),
]);
