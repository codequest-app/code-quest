import { parseFsRoots } from '@code-quest/shared';
import { type LogConfig, parseLogConfig } from '@code-quest/shared/node';

type Env = Record<string, string | undefined>;

export interface RemoteConfig {
  readonly server: string;
  readonly token: string | undefined;
  readonly fsRoots: string[];
  readonly log: LogConfig;
  readonly showHelp: boolean;
}

interface LoadOptions {
  argv?: string[];
  env?: Env;
}

function parseString(raw: string | undefined): string | undefined {
  const trimmed = raw?.trim();
  return trimmed || undefined;
}

function parseCliArgs(argv: string[]): {
  server?: string;
  token?: string;
  roots?: string;
  help?: boolean;
} {
  const result: { server?: string; token?: string; roots?: string; help?: boolean } = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--server' && argv[i + 1]) result.server = argv[++i];
    else if (argv[i] === '--token' && argv[i + 1]) result.token = argv[++i];
    else if (argv[i] === '--roots' && argv[i + 1]) result.roots = argv[++i];
    else if (argv[i] === '--help' || argv[i] === '-h') result.help = true;
  }
  return result;
}

export function loadConfig(options: LoadOptions = {}): RemoteConfig {
  const { argv = [], env = {} } = options;
  const cli = parseCliArgs(argv);

  return {
    server: parseString(cli.server ?? env.SUMMONER_SERVER) ?? 'ws://127.0.0.1:3000/summoner',
    token: parseString(cli.token ?? env.SUMMONER_TOKEN),
    fsRoots: parseFsRoots(cli.roots ?? env.EXPLORER_ROOTS),
    log: parseLogConfig(env),
    showHelp: cli.help ?? false,
  };
}
