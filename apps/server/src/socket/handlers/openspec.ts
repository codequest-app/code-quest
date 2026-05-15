import type { SocketCallback, TypedSocket } from '@code-quest/schemas';
import {
  EVENTS,
  openspecArchivePayloadSchema,
  openspecChangeNewPayloadSchema,
  openspecListPayloadSchema,
  openspecReadPayloadSchema,
  openspecToggleTaskPayloadSchema,
} from '@code-quest/schemas';
import type { ZodType } from 'zod';
import { logger } from '../../logger.ts';
import type { HandlerContext } from '../../types.ts';

type EmitterHandler = (
  ch: unknown,
  payload: unknown,
  socket?: TypedSocket,
  callback?: SocketCallback,
) => Promise<void>;

function createHandler<T>(
  schema: ZodType<T>,
  fn: (parsed: T) => Promise<Record<string, unknown>>,
  errorLabel: string,
): EmitterHandler {
  return async function handler(_ch, payload, _socket, callback) {
    try {
      const parsed = schema.parse(payload);
      callback?.(await fn(parsed));
    } catch (err) {
      logger.warn({ err }, `${errorLabel} failed`);
      callback?.({ error: `${errorLabel} failed` });
    }
  };
}

export function create({
  emitter,
  openspecService,
}: Pick<HandlerContext, 'emitter' | 'openspecService'>): void {
  emitter.on(
    EVENTS.openspec.list,
    createHandler(
      openspecListPayloadSchema,
      ({ cwd }) => openspecService.list(cwd),
      'openspec:list',
    ),
  );

  emitter.on(
    EVENTS.openspec.read,
    createHandler(
      openspecReadPayloadSchema,
      ({ cwd, kind, name, artifact }) => openspecService.read(cwd, kind, name, artifact),
      'openspec:read',
    ),
  );

  emitter.on(
    EVENTS.openspec.changeNew,
    createHandler(
      openspecChangeNewPayloadSchema,
      ({ cwd, name }) => openspecService.changeNew(cwd, name),
      'openspec:changeNew',
    ),
  );

  emitter.on(
    EVENTS.openspec.archive,
    createHandler(
      openspecArchivePayloadSchema,
      ({ cwd, name, skipSpecs }) => openspecService.archive(cwd, name, { skipSpecs }),
      'openspec:archive',
    ),
  );

  emitter.on(
    EVENTS.openspec.toggleTask,
    createHandler(
      openspecToggleTaskPayloadSchema,
      ({ cwd, name, lineIndex }) => openspecService.toggleTask(cwd, name, lineIndex),
      'openspec:toggleTask',
    ),
  );
}
