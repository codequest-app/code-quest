import type { SessionStore } from '../../../services/session-store.ts';
import type { SettingsStore } from '../../../services/settings-store.ts';
import type { ChannelEventRouter } from '../../channel-event-router.ts';
import type { ChannelManager } from '../../channel-manager.ts';
import type { SessionHistory } from '../../session-history.ts';
import type { SocketHandler, TypedSocket } from '../../types.ts';
import { create as createFork } from './fork.ts';
import {
  handleClose,
  handleGenerateTitle,
  handleJoin,
  handleLaunch,
  handleResume,
  handleUpdateState,
  type LifecycleDeps,
  onChannelExit,
  onSessionInit,
} from './lifecycle.ts';
import { create as createRecord } from './record.ts';

export function create(
  channelManager: ChannelManager,
  sessionStore: SessionStore,
  settingsStore: SettingsStore,
  sessionHistory: SessionHistory,
): SocketHandler {
  const deps: LifecycleDeps = { channelManager, settingsStore, sessionStore, sessionHistory };
  const forkHandler = createFork(channelManager, sessionHistory, sessionStore);
  const recordHandler = createRecord(channelManager, sessionStore, sessionHistory);

  return {
    register(socket: TypedSocket) {
      socket.on('session:launch', (p, cb) => handleLaunch(socket, deps, p, cb));
      socket.on('session:join', (p, cb) => handleJoin(socket, deps, p, cb));
      socket.on('session:close', (p) => handleClose(deps, p));
      socket.on('session:resume', (p) => handleResume(deps, p));
      socket.on('session:generate_title', (p, cb) => handleGenerateTitle(deps, p, cb));
      socket.on('session:update_state', (p, cb) => handleUpdateState(deps, p, cb));
      forkHandler.register(socket);
      recordHandler.register(socket);
    },
    subscribe(router: ChannelEventRouter) {
      router.onEvent('session:init', (cid) => onSessionInit(deps, cid));
      router.onExit((cid, ch) => onChannelExit(deps, cid, ch));
      forkHandler.subscribe?.(router);
      recordHandler.subscribe?.(router);
    },
  };
}
