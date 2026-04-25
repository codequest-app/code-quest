import { describe, expect, it } from 'vitest';
import { LocalPluginCliService } from '../../claude/plugin-cli.ts';

describe('LocalPluginCliService', () => {
  it('run resolves with stdout/ok=true for a successful command', async () => {
    const svc = new LocalPluginCliService({ binary: 'echo' });
    const result = await svc.run(['hello']);
    expect(result.ok).toBe(true);
    expect(result.stdout.trim()).toBe('hello');
  });

  it('run resolves with ok=false AND surfaces the error message when binary is missing', async () => {
    const svc = new LocalPluginCliService({ binary: 'this-does-not-exist-xyz' });
    const result = await svc.run(['list']);
    expect(result.ok).toBe(false);
    // Without the error info, callers can't distinguish ENOENT from a CLI
    // non-zero exit — UI shows a generic "Failed" toast and operators have
    // nothing to triage with.
    expect(result.stderr.length).toBeGreaterThan(0);
  });

  it('does NOT shell-interpret args (security: no command injection)', async () => {
    const svc = new LocalPluginCliService({ binary: 'echo' });
    // If args were shell-interpolated the `;` would terminate echo and
    // run a second command. With execFile (no shell) the literal string
    // round-trips through the single argv slot.
    const result = await svc.run(['hello;', 'echo', 'pwned']);
    expect(result.ok).toBe(true);
    expect(result.stdout).toContain('hello;');
    expect(result.stdout).toContain('echo');
    expect(result.stdout).toContain('pwned');
  });
});
