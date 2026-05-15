import 'dotenv/config';
import { LocalFilesystemService } from '@code-quest/filesystem';
import { LocalGitService } from '@code-quest/git';
import { formatBanner } from '@code-quest/schemas';
import { WsClient } from '@code-quest/transport';
import { loadConfig } from './config.ts';
import { Agent } from './connection/agent.ts';
import { LocalRootGuard } from './filesystem/local-root-guard.ts';
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

logger.info(
  formatBanner('Code Quest Summoner', [
    { key: 'Server', value: config.server },
    { key: 'Token', value: '***' },
    { key: 'Roots', value: config.fsRoots.join(', ') },
  ]),
);

const processProvider = new ChildProcessProvider();
const rootGuard = new LocalRootGuard(config.fsRoots);
const filesystem = new LocalFilesystemService(config.fsRoots, rootGuard);
const git = new LocalGitService();

const serverUrl = new URL(config.server);
serverUrl.searchParams.set('sessionKey', crypto.randomUUID());

const client = new WsClient(serverUrl.toString(), {
  headers: { Authorization: `Bearer ${config.token}` },
});

const agent = new Agent(processProvider, filesystem, git);
agent.attach(client);

client.setLifecycleListener({
  onOpen: (id) => logger.info({ connectionId: id }, `[summoner] connected to ${config.server}`),
  onClose: () => logger.warn('[summoner] disconnected, reconnecting...'),
});

client.connect();

for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, () => {
    agent.dispose();
    client.disconnect();
    process.exit(0);
  });
}
