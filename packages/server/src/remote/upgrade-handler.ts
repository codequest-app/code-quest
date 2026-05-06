import type { Server as HttpServer } from 'node:http';
import { WebSocketServer } from 'ws';
import { logger } from '../logger.ts';
import { Connection } from './connection.ts';

const SUMMONER_PATH = '/summoner';
const BEARER_PREFIX = 'Bearer ';

export interface UpgradeOptions {
  token: string;
  onConnect: (conn: Connection) => void;
  onDisconnect: () => void;
}

export function createUpgradeHandler(opts: UpgradeOptions): {
  attach(httpServer: HttpServer): void;
} {
  const { token, onConnect, onDisconnect } = opts;
  const wss = new WebSocketServer({ noServer: true });
  let activeConn: Connection | null = null;

  function attach(httpServer: HttpServer): void {
    httpServer.on('upgrade', (request, socket, head) => {
      const rawUrl = request.url ?? '';
      if (!rawUrl.startsWith(SUMMONER_PATH)) return;

      const auth = request.headers.authorization ?? '';
      const reqToken = auth.startsWith(BEARER_PREFIX) ? auth.slice(BEARER_PREFIX.length) : '';
      if (reqToken !== token) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        logger.warn('remote daemon rejected: invalid token');
        return;
      }

      // A daemon in CLOSING state returns isOpen=false, allowing a new connection
      // while the old one drains. This is acceptable — the old connection will
      // fire onDisconnect shortly and get cleaned up.
      if (activeConn?.isOpen) {
        socket.write('HTTP/1.1 409 Conflict\r\n\r\n');
        socket.destroy();
        logger.warn('remote daemon rejected: another daemon is already connected');
        return;
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        logger.info('remote daemon connected');

        if (activeConn) {
          activeConn.replaceSocket(ws);
          logger.info('remote daemon reconnected — socket replaced');
        } else {
          activeConn = new Connection(ws);
          activeConn.startHeartbeat();
          activeConn.onDisconnect(() => {
            logger.warn('remote daemon disconnected — remote calls will fail until reconnect');
            onDisconnect();
          });
        }

        onConnect(activeConn);
      });
    });
  }

  return { attach };
}
