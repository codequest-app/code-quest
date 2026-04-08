import { fileListPayloadSchema, fileReadPayloadSchema } from '@code-quest/shared';
import { logger } from '../../logger.ts';
import type { HandlerContext } from '../../types.ts';
import type { Channel } from '../channel.ts';
import { withChannel, withError } from '../channel-emitter.ts';
import type { SocketCallback, TypedSocket } from '../types.ts';

export function create({
  emitter,
  filesystemService: fs,
}: Pick<HandlerContext, 'emitter' | 'filesystemService'>): void {
  function handleRead(
    ch: Channel,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): void {
    const { filePath } = fileReadPayloadSchema.parse(payload);
    if (!ch.cwd) {
      callback?.({ error: 'No working directory' });
      return;
    }
    const result = fs.readFile(ch.cwd, filePath);
    if ('error' in result) {
      logger.warn({ filePath, error: result.error }, 'Failed to read file');
    }
    callback?.(result);
  }

  function handleList(
    ch: Channel,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): void {
    try {
      const { pattern } = fileListPayloadSchema.parse(payload);
      if (!ch.cwd) {
        callback?.({ files: [] });
        return;
      }

      const files = fs.listFiles(ch.cwd, pattern);
      callback?.({ files });
    } catch (err) {
      logger.warn({ err }, 'Failed to list files');
      callback?.({ files: [] });
    }
  }

  emitter.on('file:read', withError(withChannel(handleRead)));
  emitter.on('file:list', withChannel(handleList));
}
