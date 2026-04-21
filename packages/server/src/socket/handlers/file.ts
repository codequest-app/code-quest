import { EVENTS, fileListPayloadSchema, fileReadPayloadSchema } from '@code-quest/shared';
import { logger } from '../../logger.ts';
import type { HandlerContext } from '../../types.ts';
import type { Channel } from '../channel.ts';
import { withChannel, withError } from '../channel-emitter.ts';
import type { SocketCallback, TypedSocket } from '../types.ts';
import { ok } from '../utils/rpc.ts';

export function create({
  emitter,
  filesystemService: fs,
}: Pick<HandlerContext, 'emitter' | 'filesystemService'>): void {
  async function handleRead(
    ch: Channel,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    const { filePath } = fileReadPayloadSchema.parse(payload);
    if (!ch.cwd) {
      callback?.({ error: 'No working directory' });
      return;
    }
    const result = await fs.readFile(ch.cwd, filePath);
    if ('error' in result) {
      logger.warn({ filePath, error: result.error }, 'Failed to read file');
    }
    callback?.(result);
  }

  async function handleList(
    ch: Channel,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const { pattern } = fileListPayloadSchema.parse(payload);
      if (!ch.cwd) {
        callback?.(ok({ files: [] }));
        return;
      }

      const files = await fs.listFiles(ch.cwd, pattern);
      callback?.(ok({ files }));
    } catch (err) {
      logger.warn({ err }, 'Failed to list files');
      callback?.(ok({ files: [] }));
    }
  }

  emitter.on(EVENTS.file.read, withError(withChannel(handleRead)));
  emitter.on(EVENTS.file.list, withChannel(handleList));
}
