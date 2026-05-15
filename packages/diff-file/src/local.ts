import { readFile } from 'node:fs/promises';
import type { DiffFileService } from './types.ts';

interface MinimalLogger {
  debug(obj: object, msg: string): void;
}

export class LocalDiffFileService implements DiffFileService {
  private readonly logger: MinimalLogger | undefined;

  constructor(logger?: MinimalLogger) {
    this.logger = logger;
  }

  async read(path: string): Promise<string> {
    if (!path) return '';
    try {
      return await readFile(path, 'utf-8');
    } catch (err) {
      this.logger?.debug({ err, path }, 'Failed to read diff file');
      return '';
    }
  }
}
