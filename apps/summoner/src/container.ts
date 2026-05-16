import {
  type Broadcaster,
  FilesDataSource,
  GitDataSource,
  LocalBroadcaster,
  OpenspecDataSource,
} from '@code-quest/broadcaster';
import { LocalFilesystemService, LocalRootGuard } from '@code-quest/filesystem';
import { LocalGitService } from '@code-quest/git';
import { LocalOpenspecService } from '@code-quest/openspec';
import type { FilesystemService, GitService, ProcessProvider } from '@code-quest/schemas';
import { LocalWatchService } from '@code-quest/watch';
import type { RemoteConfig as Config } from './config.ts';
import { ChildProcessProvider } from './transports/child-process.ts';

export class Token<T> {
  declare readonly _phantom: T;
  readonly symbol: symbol;
  readonly name: string;
  constructor(name: string) {
    this.name = name;
    this.symbol = Symbol(name);
  }
}

export class Container {
  private readonly map = new Map<symbol, unknown>();

  bind<T>(token: Token<T>, value: T): this {
    this.map.set(token.symbol, value);
    return this;
  }

  get<T>(token: Token<T>): T {
    const v = this.map.get(token.symbol);
    if (v === undefined) throw new Error(`No binding for ${token.name}`);
    return v as T;
  }
}

export const TOKENS: {
  Filesystem: Token<FilesystemService>;
  Git: Token<GitService>;
  ProcessProvider: Token<ProcessProvider>;
  Broadcaster: Token<Broadcaster>;
} = {
  Filesystem: new Token<FilesystemService>('FilesystemService'),
  Git: new Token<GitService>('GitService'),
  ProcessProvider: new Token<ProcessProvider>('ProcessProvider'),
  Broadcaster: new Token<Broadcaster>('Broadcaster'),
};

export function createContainer(config: Config): Container {
  const processProvider = new ChildProcessProvider();
  const rootGuard = new LocalRootGuard(config.fsRoots);
  const filesystem = new LocalFilesystemService(config.fsRoots, rootGuard);
  const git = new LocalGitService();
  const watchService = new LocalWatchService();
  const openspec = new LocalOpenspecService(filesystem, processProvider);

  const broadcaster = new LocalBroadcaster()
    .add('files', (cwd) => new FilesDataSource(cwd, watchService, filesystem))
    .add('git', (cwd) => new GitDataSource(cwd, watchService, git))
    .add('openspec', (cwd) => new OpenspecDataSource(cwd, watchService, openspec));

  return new Container()
    .bind(TOKENS.ProcessProvider, processProvider)
    .bind(TOKENS.Filesystem, filesystem)
    .bind(TOKENS.Git, git)
    .bind(TOKENS.Broadcaster, broadcaster);
}
