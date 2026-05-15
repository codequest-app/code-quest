import type { FileResult, FilesystemService, WatchService } from '@code-quest/schemas';
import { DataSource } from '../data-source.ts';

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

export class FilesDataSource extends DataSource<FileResult[]> {
  private readonly cwd: string;
  private readonly pattern: string;
  private readonly fs: FilesystemService;

  constructor(cwd: string, watchService: WatchService, fs: FilesystemService, pattern = '') {
    super(cwd, watchService, matchesFs);
    this.cwd = cwd;
    this.pattern = pattern;
    this.fs = fs;
  }

  async read(): Promise<FileResult[]> {
    return this.fs.listFiles(this.cwd, this.pattern);
  }
}
