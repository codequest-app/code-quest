import 'dotenv/config';
import { formatBanner } from '@code-quest/shared';
import { bearerToken, createConnectionLoop, WsTransport, wsAdapter } from '@code-quest/shared/node';
import { loadConfig } from './config.ts';
import { Agent } from './connection/agent.ts';
import { LocalFilesystemService } from './filesystem/local.ts';
import { LocalRootGuard } from './filesystem/local-root-guard.ts';
import { LocalWatchService } from './fs-watch/local.ts';
import { LocalGitService } from './git/local.ts';
import { logger } from './logger.ts';
import { ChildProcessProvider } from './transports/child-process.ts';

const config = loadConfig({
  argv: process.argv.slice(2),
  env: process.env,
});

if (config.showHelp) {
  console.log(`
  Usage: summoner [options]

  Options:
    --server <url>    Server WebSocket URL (default: ws://127.0.0.1:3000/summoner)
    --token <token>   Authentication token (required)
    --roots <paths>   Comma-separated directories to share (default: $HOME)
    --help, -h        Show this help

  Environment variables:
    SUMMONER_SERVER   Same as --server
    SUMMONER_TOKEN    Same as --token
    EXPLORER_ROOTS    Same as --roots
`);
  process.exit(0);
}

if (!config.token) {
  logger.error('Token required. Use --token <token> or set SUMMONER_TOKEN env var.');
  process.exit(1);
}

console.log(
  formatBanner('Code Quest Summoner', [
    { key: 'Server', value: config.server },
    { key: 'Token', value: '***' },
    { key: 'Roots', value: config.fsRoots.join(', ') },
  ]),
);

const processProvider = new ChildProcessProvider();
const rootGuard = new LocalRootGuard(config.fsRoots);
const filesystem = new LocalFilesystemService(config.fsRoots, rootGuard, new LocalWatchService());
const git = new LocalGitService();

const transport = new WsTransport(wsAdapter());

const serverUrl = new URL(config.server);
serverUrl.searchParams.set('sessionKey', crypto.randomUUID());

createConnectionLoop(transport, serverUrl.toString(), {
  middleware: [bearerToken(config.token)],
  createAgent: (rpc) => new Agent(rpc, processProvider, filesystem, git),
  onConnect: () => logger.info(`[summoner] connected to ${config.server}`),
  onDisconnect: () => logger.warn('[summoner] disconnected, will reconnect...'),
  onReconnecting: () => logger.info('[summoner] reconnecting...'),
});
