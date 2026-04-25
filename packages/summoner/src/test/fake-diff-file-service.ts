import type { DiffFileService } from '../diff-file/types.ts';

/** In-memory DiffFileService for tests. Seed contents via `set`; unseeded
 *  paths return '' (matches LocalDiffFileService's missing-file behavior). */
export class FakeDiffFileService implements DiffFileService {
  readonly calls: string[] = [];
  private contents = new Map<string, string>();

  set(path: string, content: string): void {
    this.contents.set(path, content);
  }

  async read(path: string): Promise<string> {
    this.calls.push(path);
    return this.contents.get(path) ?? '';
  }
}
