import { parseFsRoots } from '@code-quest/shared';

type Env = Record<string, string | undefined>;

export interface RemoteConfig {
  readonly server: string | undefined;
  readonly token: string | undefined;
  readonly fsRoots: string[];
}

interface LoadOptions {
  argv?: string[];
  env?: Env;
}

function parseString(raw: string | undefined): string | undefined {
  const trimmed = raw?.trim();
  return trimmed || undefined;
}

function parseCliArgs(argv: string[]): { server?: string; token?: string } {
  const result: { server?: string; token?: string } = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--server' && argv[i + 1]) result.server = argv[++i];
    else if (argv[i] === '--token' && argv[i + 1]) result.token = argv[++i];
  }
  return result;
}

export function loadConfig(options: LoadOptions = {}): RemoteConfig {
  const { argv = [], env = {} } = options;
  const cli = parseCliArgs(argv);

  return {
    server: parseString(cli.server ?? env.REMOTE_SERVER),
    token: parseString(cli.token ?? env.REMOTE_TOKEN),
    fsRoots: parseFsRoots(env.EXPLORER_ROOTS),
  };
}
