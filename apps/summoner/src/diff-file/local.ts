import { readFile } from 'node:fs/promises';
import { logger } from '../logger.ts';
import type { DiffFileService } from './types.ts';

export class LocalDiffFileService implements DiffFileService {
  async read(path: string): Promise<string> {
    if (!path) return '';
    try {
      return await readFile(path, 'utf-8');
    } catch (err) {
      logger.debug({ err, path }, 'Failed to read diff file');
      return '';
    }
  }
}
