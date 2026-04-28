import { readFile } from 'node:fs/promises';
import type { DiffFileService } from './types.ts';

export class LocalDiffFileService implements DiffFileService {
  async read(path: string): Promise<string> {
    if (!path) return '';
    try {
      return await readFile(path, 'utf-8');
    } catch (err) {
      console.debug('Failed to read diff file', path, err);
      return '';
    }
  }
}
