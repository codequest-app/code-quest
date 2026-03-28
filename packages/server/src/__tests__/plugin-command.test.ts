import { spawnSync } from 'node:child_process';
import { runPluginCommand } from '../socket/handlers/helpers.ts';

vi.mock('node:child_process', async (importOriginal) => {
  const orig = await importOriginal<typeof import('node:child_process')>();
  return { ...orig, spawnSync: vi.fn(orig.spawnSync) };
});

const mockedSpawnSync = vi.mocked(spawnSync);

describe('runPluginCommand', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns ok: true with stdout when command succeeds', () => {
    mockedSpawnSync.mockReturnValue({
      status: 0,
      stdout: '[{"id":"p1","name":"test"}]',
      stderr: '',
      pid: 1,
      output: [],
      signal: null,
    });

    const result = runPluginCommand(['list', '--json']);

    expect(mockedSpawnSync).toHaveBeenCalledWith('claude', ['plugin', 'list', '--json'], {
      timeout: 30_000,
      encoding: 'utf-8',
    });
    expect(result).toEqual({
      ok: true,
      stdout: '[{"id":"p1","name":"test"}]',
      stderr: '',
    });
  });

  it('returns ok: false with stderr when command fails', () => {
    mockedSpawnSync.mockReturnValue({
      status: 1,
      stdout: '',
      stderr: 'Plugin not found',
      pid: 1,
      output: [],
      signal: null,
    });

    const result = runPluginCommand(['install', 'bad-plugin']);

    expect(result).toEqual({
      ok: false,
      stdout: '',
      stderr: 'Plugin not found',
    });
  });

  it('handles null stdout/stderr gracefully', () => {
    mockedSpawnSync.mockReturnValue({
      status: 0,
      stdout: null as unknown as string,
      stderr: null as unknown as string,
      pid: 1,
      output: [],
      signal: null,
    });

    const result = runPluginCommand(['list']);

    expect(result).toEqual({ ok: true, stdout: '', stderr: '' });
  });
});
