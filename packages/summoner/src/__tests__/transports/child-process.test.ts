import { describe, expect, it, vi } from 'vitest';
import { ChildProcessProvider } from '../../transports/child-process.ts';

describe('ChildProcessProvider', () => {
  it('lines yields parsed lines from stdout', async () => {
    const provider = new ChildProcessProvider();
    const handle = provider.spawn('echo', ['{"type":"init"}']);

    const lines: string[] = [];
    for await (const line of handle.lines) {
      lines.push(line);
    }

    expect(lines).toEqual(['{"type":"init"}']);
  });

  it('send writes to stdin', async () => {
    // Use cat to echo back what we send
    const provider = new ChildProcessProvider();
    const handle = provider.spawn('cat', []);

    const lines: string[] = [];
    const reader = (async () => {
      for await (const line of handle.lines) {
        lines.push(line);
        if (lines.length >= 1) handle.abort();
      }
    })();

    handle.send('{"type":"user","message":"hello"}');
    await reader;

    expect(lines).toEqual(['{"type":"user","message":"hello"}']);
  });

  it('abort terminates the process and ends lines', async () => {
    const provider = new ChildProcessProvider();
    // sleep won't exit on its own
    const handle = provider.spawn('sleep', ['10']);

    setTimeout(() => handle.abort(), 50);

    const lines: string[] = [];
    for await (const line of handle.lines) {
      lines.push(line);
    }

    expect(handle.signal.aborted).toBe(true);
    expect(lines).toEqual([]);
  });

  it('signal.aborted is false before abort', () => {
    const provider = new ChildProcessProvider();
    const handle = provider.spawn('echo', ['hi']);
    expect(handle.signal.aborted).toBe(false);
  });

  it('does not crash the process when spawn target is missing (ENOENT)', async () => {
    const provider = new ChildProcessProvider();
    // Without the 'error' listener, this throws an unhandled 'error' event
    // and crashes the Node process. With the listener it must abort cleanly.
    const { logger } = await import('../../logger.ts');
    const errSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});
    const handle = provider.spawn('this-binary-does-not-exist-xyz', []);

    const lines: string[] = [];
    for await (const line of handle.lines) {
      lines.push(line);
    }

    expect(handle.signal.aborted).toBe(true);
    expect(lines).toEqual([]);
    // Operators need to distinguish 'CLI not installed' from 'CLI exited
    // normally with no output' — silent abort hides the real failure mode.
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });
});
