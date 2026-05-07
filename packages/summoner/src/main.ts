import 'dotenv/config';
import { bearerToken, createConnectionLoop } from '@code-quest/shared';
import { WsTransport, wsAdapter } from '@code-quest/shared/node';
import { loadConfig } from './config.ts';
import { Agent } from './connection/agent.ts';
import { LocalFilesystemService } from './filesystem/local.ts';
import { LocalRootGuard } from './filesystem/local-root-guard.ts';
import { LocalGitService } from './git/local.ts';
import { ChildProcessProvider } from './transports/child-process.ts';

const config = loadConfig({
  argv: process.argv.slice(2),
  env: process.env,
});

if (!config.server || !config.token) {
  console.error(
    '[summoner] Server URL and token required. Use --server <url> --token <token> or set REMOTE_SERVER / REMOTE_TOKEN env vars.',
  );
  process.exit(1);
}

const processProvider = new ChildProcessProvider();
const rootGuard = new LocalRootGuard(config.fsRoots);
const filesystem = new LocalFilesystemService(config.fsRoots, rootGuard);
const git = new LocalGitService();

const transport = new WsTransport(wsAdapter());

createConnectionLoop(transport, config.server, {
  middleware: [bearerToken(config.token)],
  createAgent: (rpc) => new Agent(rpc, processProvider, filesystem, git),
  onConnect: () => console.log(`[summoner] connected to ${config.server}`),
  onDisconnect: () => console.warn('[summoner] disconnected, will reconnect...'),
  onReconnecting: () => console.log('[summoner] reconnecting...'),
});
