import {
  EVENTS,
  openspecArchivePayloadSchema,
  openspecChangeNewPayloadSchema,
  openspecListPayloadSchema,
  openspecReadPayloadSchema,
  openspecToggleTaskPayloadSchema,
} from '@code-quest/shared';
import { logger } from '../../logger.ts';
import type { HandlerContext } from '../../types.ts';
import type { SocketCallback, TypedSocket } from '../types.ts';

export function create({
  emitter,
  filesystemService: fs,
  openspecService,
}: Pick<HandlerContext, 'emitter' | 'filesystemService' | 'openspecService'>): void {
  emitter.on(
    EVENTS.openspec.list,
    async (_ch, payload: unknown, _socket?: TypedSocket, callback?: SocketCallback) => {
      try {
        const { cwd } = openspecListPayloadSchema.parse(payload);
        if (!fs.isWithinRoots(cwd)) {
          callback?.({ error: 'Path outside allowed roots' });
          return;
        }
        callback?.(await openspecService.list(cwd));
      } catch (err) {
        logger.warn({ err }, 'openspec:list failed');
        callback?.({ error: 'List failed' });
      }
    },
  );

  emitter.on(
    EVENTS.openspec.read,
    async (_ch, payload: unknown, _socket?: TypedSocket, callback?: SocketCallback) => {
      try {
        const { cwd, kind, name, artifact } = openspecReadPayloadSchema.parse(payload);
        if (!fs.isWithinRoots(cwd)) {
          callback?.({ error: 'Path outside allowed roots' });
          return;
        }
        callback?.(await openspecService.read(cwd, kind, name, artifact));
      } catch (err) {
        logger.warn({ err }, 'openspec:read failed');
        callback?.({ error: 'Read failed' });
      }
    },
  );

  emitter.on(
    EVENTS.openspec.changeNew,
    async (_ch, payload: unknown, _socket?: TypedSocket, callback?: SocketCallback) => {
      try {
        const { cwd, name } = openspecChangeNewPayloadSchema.parse(payload);
        if (!fs.isWithinRoots(cwd)) {
          callback?.({ error: 'Path outside allowed roots' });
          return;
        }
        callback?.(await openspecService.changeNew(cwd, name));
        // openspecDirtyBroadcaster fires automatically via the file watcher
        // once the CLI creates the new files under openspec/changes/.
      } catch (err) {
        logger.warn({ err }, 'openspec:changeNew failed');
        callback?.({ error: 'Create failed' });
      }
    },
  );

  emitter.on(
    EVENTS.openspec.archive,
    async (_ch, payload: unknown, _socket?: TypedSocket, callback?: SocketCallback) => {
      try {
        const { cwd, name, skipSpecs } = openspecArchivePayloadSchema.parse(payload);
        if (!fs.isWithinRoots(cwd)) {
          callback?.({ error: 'Path outside allowed roots' });
          return;
        }
        callback?.(await openspecService.archive(cwd, name, { skipSpecs }));
        // openspecDirtyBroadcaster refreshes via the file watcher as the
        // change directory moves into openspec/changes/archive/.
      } catch (err) {
        logger.warn({ err }, 'openspec:archive failed');
        callback?.({ error: 'Archive failed' });
      }
    },
  );

  emitter.on(
    EVENTS.openspec.toggleTask,
    async (_ch, payload: unknown, _socket?: TypedSocket, callback?: SocketCallback) => {
      try {
        const { cwd, name, lineIndex } = openspecToggleTaskPayloadSchema.parse(payload);
        if (!fs.isWithinRoots(cwd)) {
          callback?.({ error: 'Path outside allowed roots' });
          return;
        }
        callback?.(await openspecService.toggleTask(cwd, name, lineIndex));
      } catch (err) {
        logger.warn({ err }, 'openspec:toggleTask failed');
        callback?.({ error: 'Toggle failed' });
      }
    },
  );
}
