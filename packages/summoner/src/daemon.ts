import 'dotenv/config';
import { loadConfig } from './config.ts';
import { Agent } from './daemon/agent.ts';
import { createDaemonConnection } from './daemon/connection.ts';
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

let agent: Agent | null = null;

createDaemonConnection({
  server: config.server,
  token: config.token,
  onConnect: (ws) => {
    agent?.dispose();
    console.log(`[summoner] connected to ${config.server}`);
    agent = new Agent(ws, processProvider, filesystem, git);
  },
  onDisconnect: () => {
    agent?.dispose();
    agent = null;
    console.warn('[summoner] disconnected, will reconnect...');
  },
  onReconnecting: () => {
    console.log('[summoner] reconnecting...');
  },
});
