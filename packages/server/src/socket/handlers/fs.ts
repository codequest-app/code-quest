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
  const subsBySocket = new Map<string, Map<string, Unsubscribe[]>>();

  async function handleBrowse(
    _ch: unknown,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const { path, showHidden } = fsBrowsePayloadSchema.parse(payload);
      const { directories, files } = await fs.browseEntries(path, { showHidden });
      callback?.({ directories, files });
    } catch (err) {
      logger.warn({ err }, 'fs:browse failed');
      callback?.({ error: err instanceof Error ? err.message : String(err) });
    }
  }

  async function handleRead(
    _ch: unknown,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const { path } = fsReadPayloadSchema.parse(payload);
      callback?.(await fs.readFileAbsolute(path));
    } catch (err) {
      logger.warn({ err }, 'fs:read failed');
      callback?.({ error: 'Read failed' });
    }
  }

  async function handleSearch(
    _ch: unknown,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const { cwd, pattern } = fsSearchPayloadSchema.parse(payload);
      const files = await fs.listFiles(cwd, pattern);
      callback?.(ok({ files }));
    } catch (err) {
      logger.warn({ err }, 'fs:search failed');
      callback?.(ok({ files: [] }));
    }
  }

  function handleWatch(
    _ch: unknown,
    payload: unknown,
    socket?: TypedSocket,
    callback?: SocketCallback,
  ): void {
    if (!socket) {
      callback?.({});
      return;
    }
    try {
      const { cwd } = fsWatchPayloadSchema.parse(payload);
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
      perCwd.get(cwd)?.forEach((off) => {
        off();
      });
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
  }

  async function handleCreate(
    _ch: unknown,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const { path, kind } = fsCreatePayloadSchema.parse(payload);
      callback?.(await fs.create(path, kind));
    } catch (err) {
      logger.warn({ err }, 'fs:create failed');
      callback?.({ error: 'Create failed' });
    }
  }

  async function handleDelete(
    _ch: unknown,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const { path } = fsDeletePayloadSchema.parse(payload);
      callback?.(await fs.delete(path));
    } catch (err) {
      logger.warn({ err }, 'fs:delete failed');
      callback?.({ error: 'Delete failed' });
    }
  }

  async function handleRename(
    _ch: unknown,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const { from, to } = fsRenamePayloadSchema.parse(payload);
      callback?.(await fs.rename(from, to));
    } catch (err) {
      logger.warn({ err }, 'fs:rename failed');
      callback?.({ error: 'Rename failed' });
    }
  }

  async function handleCopy(
    _ch: unknown,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const { from, to } = fsCopyPayloadSchema.parse(payload);
      callback?.(await fs.copy(from, to));
    } catch (err) {
      logger.warn({ err }, 'fs:copy failed');
      callback?.({ error: 'Copy failed' });
    }
  }

  async function handleMove(
    _ch: unknown,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const { from, to } = fsMovePayloadSchema.parse(payload);
      callback?.(await fs.move(from, to));
    } catch (err) {
      logger.warn({ err }, 'fs:move failed');
      callback?.({ error: 'Move failed' });
    }
  }

  function handleUnwatch(
    _ch: unknown,
    payload: unknown,
    socket?: TypedSocket,
    callback?: SocketCallback,
  ): void {
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
  }

  emitter.on(EVENTS.fs.browse, handleBrowse);
  emitter.on(EVENTS.fs.read, handleRead);
  emitter.on(EVENTS.fs.search, handleSearch);
  emitter.on(EVENTS.fs.watch, handleWatch);
  emitter.on(EVENTS.fs.create, handleCreate);
  emitter.on(EVENTS.fs.delete, handleDelete);
  emitter.on(EVENTS.fs.rename, handleRename);
  emitter.on(EVENTS.fs.copy, handleCopy);
  emitter.on(EVENTS.fs.move, handleMove);
  emitter.on(EVENTS.fs.unwatch, handleUnwatch);
}
