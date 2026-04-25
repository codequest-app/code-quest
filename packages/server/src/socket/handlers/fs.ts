import {
  EVENTS,
  fsBrowsePayloadSchema,
  fsCopyPayloadSchema,
  fsCreatePayloadSchema,
  fsDeletePayloadSchema,
  fsMovePayloadSchema,
  fsReadPayloadSchema,
  fsRenamePayloadSchema,
  fsSearchPayloadSchema,
  fsUnwatchPayloadSchema,
  fsWatchPayloadSchema,
} from '@code-quest/shared';
import type { Unsubscribe } from '@code-quest/summoner';
import { logger } from '../../logger.ts';
import type { HandlerContext } from '../../types.ts';
import { subscribeDirtyForSocket } from '../dirty-subscriber.ts';
import type { SocketCallback, TypedSocket } from '../types.ts';
import { ok } from '../utils/rpc.ts';

/**
 * Consolidated filesystem handler. Mirrors `FilesystemService`:
 *   fs:browse({path?})  → list one dir's children (path? = fsRoots)
 *   fs:read({path})     → read one file (absolute path)
 *   fs:search({cwd, q}) → fuzzy match within cwd
 *   fs:watch({cwd})     → subscribe socket to chokidar events for cwd
 *   fs:unwatch({cwd})   → drop subscription
 *
 * All ops are cwd-scoped (no channel). Replaces the former `explorer:*` and
 * channel-scoped `file:list / file:read` handlers.
 */
export function create({
  emitter,
  filesystemService: fs,
  fsDirtyBroadcaster,
  gitDirtyBroadcaster,
  openspecDirtyBroadcaster,
}: Pick<
  HandlerContext,
  | 'emitter'
  | 'filesystemService'
  | 'fsDirtyBroadcaster'
  | 'gitDirtyBroadcaster'
  | 'openspecDirtyBroadcaster'
>): void {
  // Per-socket map of cwd → unsub fns from the 3 broadcasters. Cleaned on
  // fs:unwatch and on socket disconnect.
  const subsBySocket = new Map<string, Map<string, Unsubscribe[]>>();

  emitter.on(
    EVENTS.fs.browse,
    async (_ch, payload: unknown, _socket?: TypedSocket, callback?: SocketCallback) => {
      try {
        const { path } = fsBrowsePayloadSchema.parse(payload);
        // Explicit path outside roots → return error so the UI can render a
        // clear "Path outside allowed roots" empty state instead of an
        // indistinguishable empty tree. `path === undefined` lists the
        // configured roots and is always allowed.
        if (path !== undefined && !fs.isWithinRoots(path)) {
          callback?.({ error: 'Path outside allowed roots' });
          return;
        }
        const { directories, files } = await fs.browseEntries(path);
        callback?.({ directories, files });
      } catch (err) {
        logger.warn({ err }, 'fs:browse failed');
        callback?.({ directories: [], files: [] });
      }
    },
  );

  emitter.on(
    EVENTS.fs.read,
    async (_ch, payload: unknown, _socket?: TypedSocket, callback?: SocketCallback) => {
      try {
        const { path } = fsReadPayloadSchema.parse(payload);
        callback?.(await fs.readFileAbsolute(path));
      } catch (err) {
        logger.warn({ err }, 'fs:read failed');
        callback?.({ error: 'Read failed' });
      }
    },
  );

  emitter.on(
    EVENTS.fs.search,
    async (_ch, payload: unknown, _socket?: TypedSocket, callback?: SocketCallback) => {
      try {
        const { cwd, pattern } = fsSearchPayloadSchema.parse(payload);
        if (!fs.isWithinRoots(cwd)) {
          callback?.(ok({ files: [] }));
          return;
        }
        const files = await fs.listFiles(cwd, pattern);
        callback?.(ok({ files }));
      } catch (err) {
        logger.warn({ err }, 'fs:search failed');
        callback?.(ok({ files: [] }));
      }
    },
  );

  emitter.on(
    EVENTS.fs.watch,
    (_ch, payload: unknown, socket?: TypedSocket, callback?: SocketCallback) => {
      if (!socket) {
        callback?.({});
        return;
      }
      try {
        const { cwd } = fsWatchPayloadSchema.parse(payload);
        if (!fs.isWithinRoots(cwd)) {
          logger.warn({ cwd }, 'fs:watch outside allowed roots; ignored');
          callback?.({});
          return;
        }
        let perCwd = subsBySocket.get(socket.id);
        if (!perCwd) {
          perCwd = new Map();
          subsBySocket.set(socket.id, perCwd);
          socket.on('disconnect', () => {
            const m = subsBySocket.get(socket.id);
            if (!m) return;
            for (const unsubs of m.values()) for (const off of unsubs) off();
            subsBySocket.delete(socket.id);
          });
        }
        // Re-subscribing the same (socket, cwd) replaces — release first.
        perCwd.get(cwd)?.forEach((off) => {
          off();
        });
        // (topic, subscriberId) keying in TopicEmitter dedups against any
        // other path (e.g. ChannelManager) that subscribed under the same
        // socket id for the same cwd.
        perCwd.set(
          cwd,
          subscribeDirtyForSocket(socket, cwd, {
            fs: fsDirtyBroadcaster,
            git: gitDirtyBroadcaster,
            openspec: openspecDirtyBroadcaster,
          }),
        );
        callback?.({});
      } catch (err) {
        logger.warn({ err }, 'fs:watch failed');
        callback?.({});
      }
    },
  );

  emitter.on(
    EVENTS.fs.create,
    async (_ch, payload: unknown, _socket?: TypedSocket, callback?: SocketCallback) => {
      try {
        const { path, kind } = fsCreatePayloadSchema.parse(payload);
        callback?.(await fs.create(path, kind));
      } catch (err) {
        logger.warn({ err }, 'fs:create failed');
        callback?.({ error: 'Create failed' });
      }
    },
  );

  emitter.on(
    EVENTS.fs.delete,
    async (_ch, payload: unknown, _socket?: TypedSocket, callback?: SocketCallback) => {
      try {
        const { path } = fsDeletePayloadSchema.parse(payload);
        callback?.(await fs.delete(path));
      } catch (err) {
        logger.warn({ err }, 'fs:delete failed');
        callback?.({ error: 'Delete failed' });
      }
    },
  );

  emitter.on(
    EVENTS.fs.rename,
    async (_ch, payload: unknown, _socket?: TypedSocket, callback?: SocketCallback) => {
      try {
        const { from, to } = fsRenamePayloadSchema.parse(payload);
        callback?.(await fs.rename(from, to));
      } catch (err) {
        logger.warn({ err }, 'fs:rename failed');
        callback?.({ error: 'Rename failed' });
      }
    },
  );

  emitter.on(
    EVENTS.fs.copy,
    async (_ch, payload: unknown, _socket?: TypedSocket, callback?: SocketCallback) => {
      try {
        const { from, to } = fsCopyPayloadSchema.parse(payload);
        callback?.(await fs.copy(from, to));
      } catch (err) {
        logger.warn({ err }, 'fs:copy failed');
        callback?.({ error: 'Copy failed' });
      }
    },
  );

  emitter.on(
    EVENTS.fs.move,
    async (_ch, payload: unknown, _socket?: TypedSocket, callback?: SocketCallback) => {
      try {
        const { from, to } = fsMovePayloadSchema.parse(payload);
        callback?.(await fs.move(from, to));
      } catch (err) {
        logger.warn({ err }, 'fs:move failed');
        callback?.({ error: 'Move failed' });
      }
    },
  );

  emitter.on(
    EVENTS.fs.unwatch,
    (_ch, payload: unknown, socket?: TypedSocket, callback?: SocketCallback) => {
      if (!socket) {
        callback?.({});
        return;
      }
      try {
        const { cwd } = fsUnwatchPayloadSchema.parse(payload);
        const perCwd = subsBySocket.get(socket.id);
        const unsubs = perCwd?.get(cwd);
        if (unsubs) {
          for (const off of unsubs) off();
          perCwd?.delete(cwd);
        }
        callback?.({});
      } catch (err) {
        logger.warn({ err }, 'fs:unwatch failed');
        callback?.({});
      }
    },
  );
}
