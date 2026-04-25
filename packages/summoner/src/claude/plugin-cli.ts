import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { errMsg } from '@code-quest/shared';

const execFileAsync = promisify(execFile);

export interface PluginCliRunResult {
  stdout: string;
  stderr: string;
  ok: boolean;
}

/** Async wrapper for `claude plugin <args>`. Args go directly to `execFile`
 *  (no shell) so client-supplied values can't be shell-interpreted. */
export interface PluginCliService {
  run(args: string[]): Promise<PluginCliRunResult>;
}

export interface LocalPluginCliOptions {
  /** Override the binary name. Default `'claude'`. Tests pass `'echo'`. */
  binary?: string;
  /** Process timeout, ms. Default 30s. */
  timeoutMs?: number;
  /** Max stdout/stderr buffer. Default 16MB — generous for `plugin list --json`
   *  with full marketplace catalogues. */
  maxBufferBytes?: number;
}

export class LocalPluginCliService implements PluginCliService {
  private readonly binary: string;
  private readonly timeoutMs: number;
  private readonly maxBufferBytes: number;

  constructor(opts: LocalPluginCliOptions = {}) {
    this.binary = opts.binary ?? 'claude';
    this.timeoutMs = opts.timeoutMs ?? 30_000;
    this.maxBufferBytes = opts.maxBufferBytes ?? 16 * 1024 * 1024;
  }

  async run(args: string[]): Promise<PluginCliRunResult> {
    try {
      const { stdout, stderr } = await execFileAsync(this.binary, args, {
        timeout: this.timeoutMs,
        maxBuffer: this.maxBufferBytes,
      });
      return { stdout, stderr, ok: true };
    } catch (err) {
      // execFile rejects two shapes: `{stdout, stderr, killed}` on non-zero
      // exit, plain Error on ENOENT/spawn/timeout. Normalize, and tag killed
      // (= timeout) so operator toasts show "[timeout]" not a generic error.
      const e = err as { stdout?: unknown; stderr?: unknown; killed?: unknown };
      const stdout = typeof e.stdout === 'string' ? e.stdout : '';
      const baseStderr =
        typeof e.stderr === 'string' && e.stderr.length > 0 ? e.stderr : errMsg(err);
      const stderr = e.killed === true ? `[timeout ${this.timeoutMs}ms] ${baseStderr}` : baseStderr;
      return { stdout, stderr, ok: false };
    }
  }
}
