import type { SimpleGit, StatusResult } from 'simple-git';
import { vi } from 'vitest';
import * as gitModule from '../socket/utils/git.ts';

export interface FakeGitConfig {
  status?: Partial<StatusResult>;
  log?: { all: Array<{ hash: string; message: string; author_name: string; date: string }> };
  diff?: string;
  checkoutError?: Error | null;
  fetchError?: Error | null;
  rawResults?: Record<string, string>;
  revparseResults?: Record<string, string>;
}

const DEFAULT_STATUS: StatusResult = {
  current: 'main',
  tracking: null,
  detached: false,
  ahead: 0,
  behind: 0,
  isClean: () => true,
  not_added: [],
  conflicted: [],
  created: [],
  deleted: [],
  ignored: undefined,
  modified: [],
  renamed: [],
  staged: [],
  files: [],
} as StatusResult;

export function createFakeGit(config: FakeGitConfig = {}) {
  const checkoutCalls: Array<string | string[]> = [];
  const fetchCalls: Array<[string, ...string[]]> = [];
  const rawCalls: string[][] = [];

  let checkoutFailCount = 0;

  const instance: Partial<SimpleGit> = {
    status: vi.fn().mockImplementation(async () => ({
      ...DEFAULT_STATUS,
      ...config.status,
      isClean: () => (config.status?.files?.length ?? 0) === 0,
    })),

    log: vi.fn().mockImplementation(async () => config.log ?? { all: [], latest: null }),

    diff: vi.fn().mockImplementation(async () => config.diff ?? ''),

    checkout: vi.fn().mockImplementation(async (what: string | string[]) => {
      checkoutCalls.push(what);
      if (config.checkoutError && checkoutFailCount < 3) {
        checkoutFailCount++;
        throw config.checkoutError;
      }
    }),

    fetch: vi.fn().mockImplementation(async (...args: string[]) => {
      fetchCalls.push(args as [string, ...string[]]);
      if (config.fetchError) throw config.fetchError;
    }),

    raw: vi.fn().mockImplementation(async (args: string[]) => {
      rawCalls.push(args);
      const key = args.join(' ');
      if (config.rawResults && key in config.rawResults) {
        return config.rawResults[key];
      }
      return '';
    }),

    revparse: vi.fn().mockImplementation(async (args: string[]) => {
      const key = args.join(' ');
      if (config.revparseResults && key in config.revparseResults) {
        return config.revparseResults[key];
      }
      return '';
    }),
  };

  const spy = vi.spyOn(gitModule, 'createGit').mockReturnValue(instance as SimpleGit);

  return {
    instance: instance as SimpleGit,
    spy,
    checkoutCalls,
    fetchCalls,
    rawCalls,
    restore: () => spy.mockRestore(),
    /** Make checkout succeed after N failures */
    failCheckoutTimes(n: number) {
      checkoutFailCount = 0;
      config.checkoutError = new Error('checkout failed');
      // After n failures, it will succeed (checkoutFailCount < 3 check replaced)
      let remaining = n;
      (instance.checkout as ReturnType<typeof vi.fn>).mockImplementation(
        async (what: string | string[]) => {
          checkoutCalls.push(what);
          if (remaining > 0) {
            remaining--;
            throw config.checkoutError;
          }
        },
      );
    },
  };
}
