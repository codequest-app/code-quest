/* biome-ignore-all lint/suspicious/noExplicitAny: test file uses type assertions */
import { segments as s } from '@code-quest/summoner/test';
import { createFakeClaude } from '../test/index.ts';

async function setup(sessionId = 'cli-sess') {
  const claude = createFakeClaude();
  const channelId = await claude.initialize(s.init(sessionId));
  return { claude, channelId };
}

describe('ChatHandler > git', () => {
  it('git:update_skipped_branch records entry and returns success', async () => {
    const { claude, channelId } = await setup();

    const result = await claude.send<{ success: boolean }>('update_skipped_branch', {
      channelId,
      branch: 'feature/x',
      failed: true,
    });

    expect(result.success).toBe(true);
  });

  it('git:exec runs a command and returns output', async () => {
    const claude = createFakeClaude();

    const result = await claude.send<{ exitCode: number; stdout: string; stderr: string }>('exec', {
      command: 'echo',
      args: ['hello'],
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe('hello');
  });

  it('git:exec returns error for non-existent command', async () => {
    const claude = createFakeClaude();

    const result = await claude.send<{ exitCode: number; stdout: string; stderr: string }>('exec', {
      command: 'nonexistent_cmd_xyz_12345',
    });

    expect(result.exitCode).not.toBe(0);
  });
});
