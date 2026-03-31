import { describe, expect, it } from 'vitest';
import { ChildProcessProvider } from '../transports/child-process.ts';

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
});
