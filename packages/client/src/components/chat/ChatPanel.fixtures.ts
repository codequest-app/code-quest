import { segments as s } from '@code-quest/summoner/test';
import { buildChannelState } from '../../test/build-channel-state';
import type { ChannelState } from '../../types/chat';

export const heavyToolUseState: Partial<ChannelState> = buildChannelState([
  s.user('Find all usages of the old API and migrate them to the new one'),
  s.thinking(
    'I need to find all usages of the deprecated API first, then understand the new API shape before making changes.',
  ),
  s.assistant({
    toolUse: { id: 'ht-t1', name: 'Grep', input: { pattern: 'oldApi\\(', include: '**/*.ts' } },
  }),
  s.toolResult('ht-t1', 'src/auth.ts:12\nsrc/users.ts:45\nsrc/api/index.ts:8'),
  s.assistant({ toolUse: { id: 'ht-t2', name: 'Read', input: { file_path: '/src/auth.ts' } } }),
  s.toolResult('ht-t2', 'import { oldApi } from "../lib";\n\noldApi({ user, token });'),
  s.assistant({ toolUse: { id: 'ht-t3', name: 'Read', input: { file_path: '/src/users.ts' } } }),
  s.toolResult('ht-t3', 'const result = oldApi({ userId: id });'),
  s.assistant({
    toolUse: { id: 'ht-t4', name: 'Read', input: { file_path: '/src/api/index.ts' } },
  }),
  s.toolResult('ht-t4', 'export const handler = (req) => oldApi(req.params);'),
  s.thinking(
    'I have read all usages. The new API uses a different signature: newApi({ context, payload }). I need to transform each call accordingly.',
  ),
  s.assistant({ toolUse: { id: 'ht-t5', name: 'Edit', input: { file_path: '/src/auth.ts' } } }),
  s.toolResult(
    'ht-t5',
    '-oldApi({ user, token });\n+newApi({ context: { user }, payload: { token } });',
  ),
  s.assistant({ toolUse: { id: 'ht-t6', name: 'Edit', input: { file_path: '/src/users.ts' } } }),
  s.toolResult(
    'ht-t6',
    '-const result = oldApi({ userId: id });\n+const result = newApi({ context: {}, payload: { userId: id } });',
  ),
  s.assistant({
    toolUse: { id: 'ht-t7', name: 'Edit', input: { file_path: '/src/api/index.ts' } },
  }),
  s.toolResult(
    'ht-t7',
    '-export const handler = (req) => oldApi(req.params);\n+export const handler = (req) => newApi({ context: req, payload: req.params });',
  ),
  s.assistant({ toolUse: { id: 'ht-t8', name: 'Bash', input: { command: 'npx tsc --noEmit' } } }),
  s.toolResult('ht-t8', ''),
  s.assistant('Migrated all 3 usages from `oldApi` to `newApi`. TypeScript is happy — no errors.'),
  s.result(),
]);

export const skillInvocationState: Partial<ChannelState> = buildChannelState([
  s.user('Validate this Zod schema and suggest improvements'),
  s.thinking('I will use the zod-validation skill to check this.'),
  s.assistant({ toolUse: { id: 'sk-t1', name: 'Read', input: { file_path: '/src/schemas.ts' } } }),
  s.toolResult(
    'sk-t1',
    'export const userSchema = z.object({ name: z.string(), age: z.number() });',
  ),
  s.assistant({ toolUse: { id: 'sk-t2', name: 'Skill', input: { skill: 'zod-validation' } } }),
  s.toolResult('sk-t2', 'Schema validated: add .min(0) to age, consider .trim() on name.'),
  s.assistant(
    'The schema looks good. Two suggestions: add `.min(0)` to `age` and `.trim()` to `name`.',
  ),
  s.result(),
]);

export const subagentRunningState: Partial<ChannelState> = buildChannelState([
  s.user('Analyse protocol.md and find issues'),
  s.thinking('I will spawn a subagent to analyse the file in detail.'),
  s.agent('sar-task-1', 'Analyse protocol.md and find issues', { subagentType: 'Explore' }),
  s.taskStarted('sar-task-1', 'Analyse protocol.md and find issues'),
  s.taskProgress('sar-task-1', { toolUseId: 'sar-task-1', lastToolName: 'Grep' }),
  s.thinking('The subagent is searching through the protocol file…', {
    parentToolUseId: 'sar-task-1',
  }),
  s.assistant(
    {
      toolUse: { id: 'sar-grep-1', name: 'Grep', input: { pattern: 'error', path: 'protocol.md' } },
    },
    { parentToolUseId: 'sar-task-1' },
  ),
]);

export const subagentDoneState: Partial<ChannelState> = buildChannelState([
  s.user('Analyse protocol.md and find issues'),
  s.thinking('I will spawn a subagent to analyse the file in detail.'),
  s.agent('sad-task-1', 'Analyse protocol.md and find issues', { subagentType: 'Explore' }),
  s.taskStarted('sad-task-1', 'Analyse protocol.md and find issues'),
  s.taskNotification('sad-task-1', {
    toolUseId: 'sad-task-1',
    status: 'completed',
    summary: 'Found 3 issues: missing auth header, stale token check, no rate limiting',
  }),
  s.assistant(
    'The subagent found 3 issues in protocol.md. I recommend fixing the auth header first.',
  ),
  s.result(),
]);
