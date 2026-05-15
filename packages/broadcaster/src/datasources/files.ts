import type { FileResult, FilesystemService, WatchService } from '@code-quest/schemas';
import type { Unsubscribe } from '../types.ts';

const GIT_META_RE = /^\.git\/(HEAD|index|packed-refs|refs\/.*)$/;
const IGNORE_RES: RegExp[] = [
  /^node_modules(\/|$)/,
  /^\.git\/objects(\/|$)/,
  /^\.git\/logs(\/|$)/,
  /^dist(\/|$)/,
  /^build(\/|$)/,
  /^out(\/|$)/,
  /^\.next(\/|$)/,
  /^\.turbo(\/|$)/,
  /^\.parcel-cache(\/|$)/,
  /\.log$/,
  /(^|\/)\.DS_Store$/,
];

function matchesFs(path: string): boolean {
  if (GIT_META_RE.test(path)) return false;
  for (const re of IGNORE_RES) if (re.test(path)) return false;
  return true;
}

export class FilesDataSource {
  private readonly callbacks = new Set<() => void>();
  private readonly unsub: Unsubscribe;
  private readonly cwd: string;
  private readonly pattern: string;
  private readonly fs: FilesystemService;

  constructor(cwd: string, pattern: string, watchService: WatchService, fs: FilesystemService) {
    this.cwd = cwd;
    this.pattern = pattern;
    this.fs = fs;
    this.unsub = watchService.subscribe(cwd, (ev) => {
      if (matchesFs(ev.path)) {
        for (const cb of this.callbacks) cb();
      }
    });
  }

  async read(): Promise<FileResult[]> {
    return this.fs.listFiles(this.cwd, this.pattern);
  }

  onChange(cb: () => void): Unsubscribe {
    this.callbacks.add(cb);
    return () => this.callbacks.delete(cb);
  }

  dispose(): void {
    this.unsub();
  }
}
