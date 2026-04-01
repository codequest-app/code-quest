import type { ChannelEventRouter } from '../../channel-event-router.ts';
import type { HandlerContext } from '../../context.ts';
import type { SocketHandler, TypedSocket } from '../../types.ts';
import { register as registerForkHandlers } from './fork.ts';
import {
  handleClose,
  handleGenerateTitle,
  handleJoin,
  handleLaunch,
  handleResume,
  handleUpdateState,
  onChannelExit,
  onSessionInit,
} from './lifecycle.ts';
import { registerRecord } from './record.ts';

export function create(ctx: HandlerContext): SocketHandler {
  return {
    register(socket: TypedSocket) {
      // Lifecycle
      socket.on('session:launch', (p, cb) => handleLaunch(socket, ctx, p, cb));
      socket.on('session:join', (p, cb) => handleJoin(socket, ctx, p, cb));
      socket.on('session:close', (p) => handleClose(ctx, p));
      socket.on('session:resume', (p) => handleResume(ctx, p));
      socket.on('session:generate_title', (p, cb) => handleGenerateTitle(ctx, p, cb));
      socket.on('session:update_state', (p, cb) => handleUpdateState(ctx, p, cb));
      // Fork
      registerForkHandlers(socket, ctx);
      // Record
      registerRecord(socket, ctx);
    },
    subscribe(router: ChannelEventRouter) {
      router.onEvent('session:init', (cid) => onSessionInit(ctx, cid));
      router.onExit((cid, ch) => onChannelExit(ctx, cid, ch));
    },
  };
}
