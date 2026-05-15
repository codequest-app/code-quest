import type { SocketCallback, TypedSocket } from '@code-quest/schemas';
import {
  EVENTS,
  errMsg,
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
} from '@code-quest/schemas';
import type { Unsubscribe } from '@code-quest/summoner';
import type { ZodType } from 'zod';
import { logger } from '../../logger.ts';
import type { HandlerContext } from '../../types.ts';
import { subscribeDirtyForSocket } from '../dirty-subscriber.ts';
import { ok } from '../utils/rpc.ts';

function createFsHandler<T>(
  schema: ZodType<T>,
  fn: (parsed: T) => Promise<Record<string, unknown>>,
  errorLabel: string,
  errorFallback?: Record<string, unknown>,
) {
  return async function handler(
    _ch: unknown,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      callback?.(await fn(schema.parse(payload)));
    } catch (err) {
      logger.warn({ err }, `${errorLabel} failed`);
      callback?.(errorFallback ?? { error: errMsg(err) });
    }
  };
}

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

  const handleBrowse = createFsHandler(
    fsBrowsePayloadSchema,
    async ({ path, showHidden }) => fs.browseEntries(path, { showHidden }),
    'fs:browse',
  );

  const handleRead = createFsHandler(
    fsReadPayloadSchema,
    async ({ path }) => fs.readFileAbsolute(path),
    'fs:read',
    { error: 'Read failed' },
  );

  const handleSearch = createFsHandler(
    fsSearchPayloadSchema,
    async ({ cwd, pattern }) => ok({ files: await fs.listFiles(cwd, pattern) }),
    'fs:search',
    ok({ files: [] }),
  );

  const handleCreate = createFsHandler(
    fsCreatePayloadSchema,
    async ({ path, kind }) => fs.create(path, kind),
    'fs:create',
    { error: 'Create failed' },
  );

  const handleDelete = createFsHandler(
    fsDeletePayloadSchema,
    async ({ path }) => fs.delete(path),
    'fs:delete',
    { error: 'Delete failed' },
  );

  const handleRename = createFsHandler(
    fsRenamePayloadSchema,
    async ({ from, to }) => fs.rename(from, to),
    'fs:rename',
    { error: 'Rename failed' },
  );

  const handleCopy = createFsHandler(
    fsCopyPayloadSchema,
    async ({ from, to }) => fs.copy(from, to),
    'fs:copy',
    { error: 'Copy failed' },
  );

  const handleMove = createFsHandler(
    fsMovePayloadSchema,
    async ({ from, to }) => fs.move(from, to),
    'fs:move',
    { error: 'Move failed' },
  );

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
          for (const unsubs of m.values()) {
            for (const off of unsubs) off();
          }
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
