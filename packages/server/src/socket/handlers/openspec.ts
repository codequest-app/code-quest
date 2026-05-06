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
  openspecService,
}: Pick<HandlerContext, 'emitter' | 'openspecService'>): void {
  async function handleList(
    _ch: unknown,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const { cwd } = openspecListPayloadSchema.parse(payload);

      callback?.(await openspecService.list(cwd));
    } catch (err) {
      logger.warn({ err }, 'openspec:list failed');
      callback?.({ error: 'List failed' });
    }
  }

  async function handleRead(
    _ch: unknown,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const { cwd, kind, name, artifact } = openspecReadPayloadSchema.parse(payload);

      callback?.(await openspecService.read(cwd, kind, name, artifact));
    } catch (err) {
      logger.warn({ err }, 'openspec:read failed');
      callback?.({ error: 'Read failed' });
    }
  }

  async function handleChangeNew(
    _ch: unknown,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const { cwd, name } = openspecChangeNewPayloadSchema.parse(payload);

      callback?.(await openspecService.changeNew(cwd, name));
    } catch (err) {
      logger.warn({ err }, 'openspec:changeNew failed');
      callback?.({ error: 'Create failed' });
    }
  }

  async function handleArchive(
    _ch: unknown,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const { cwd, name, skipSpecs } = openspecArchivePayloadSchema.parse(payload);

      callback?.(await openspecService.archive(cwd, name, { skipSpecs }));
    } catch (err) {
      logger.warn({ err }, 'openspec:archive failed');
      callback?.({ error: 'Archive failed' });
    }
  }

  async function handleToggleTask(
    _ch: unknown,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const { cwd, name, lineIndex } = openspecToggleTaskPayloadSchema.parse(payload);

      callback?.(await openspecService.toggleTask(cwd, name, lineIndex));
    } catch (err) {
      logger.warn({ err }, 'openspec:toggleTask failed');
      callback?.({ error: 'Toggle failed' });
    }
  }

  emitter.on(EVENTS.openspec.list, handleList);
  emitter.on(EVENTS.openspec.read, handleRead);
  emitter.on(EVENTS.openspec.changeNew, handleChangeNew);
  emitter.on(EVENTS.openspec.archive, handleArchive);
  emitter.on(EVENTS.openspec.toggleTask, handleToggleTask);
}
