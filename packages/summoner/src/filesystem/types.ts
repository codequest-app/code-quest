import type { FsMutationResult } from '@code-quest/shared';
import { z } from 'zod';

export const directoryEntrySchema = z.object({
  name: z.string(),
  path: z.string(),
});
export type DirectoryEntry = z.infer<typeof directoryEntrySchema>;

export const fileResultSchema = z.object({
  path: z.string(),
  name: z.string(),
  type: z.enum(['file', 'directory']),
});
export type FileResult = z.infer<typeof fileResultSchema>;

/** Legacy tagless variant — consumers narrow by `'error' in result`. */
export type ReadFileResult = { content: string } | { error: string };

export type WriteFileResult = { ok: true } | { error: string };

/** Re-export for convenience — same wire shape as `@code-quest/shared` */
export type { FsMutationResult };

export interface FilesystemService {
  browseDirectories(path?: string): Promise<DirectoryEntry[]>;
  /** Returns immediate child directories AND files at the given path. */
  browseEntries(path?: string): Promise<{ directories: DirectoryEntry[]; files: DirectoryEntry[] }>;
  /** Read a file by absolute path; rejects paths outside allowed roots. */
  readFileAbsolute(absolutePath: string): Promise<ReadFileResult>;
  /** Write to a file by absolute path; rejects paths outside allowed roots.
   *  Overwrites existing content. The parent directory must already exist. */
  writeFileAbsolute(absolutePath: string, content: string): Promise<WriteFileResult>;
  /** Create an empty file or directory; rejects existing targets / OOB paths. */
  create(absolutePath: string, kind: 'file' | 'directory'): Promise<FsMutationResult>;
  /** Delete a file or recursively a directory. */
  delete(absolutePath: string): Promise<FsMutationResult>;
  /** Rename within or across directories; rejects existing destinations. */
  rename(from: string, to: string): Promise<FsMutationResult>;
  /** Recursive copy of a file or directory; rejects existing destinations. */
  copy(from: string, to: string): Promise<FsMutationResult>;
  /** Move (rename across directories); rejects existing destinations. */
  move(from: string, to: string): Promise<FsMutationResult>;
  listFiles(cwd: string, pattern: string): Promise<FileResult[]>;
  readFile(cwd: string, filePath: string): Promise<ReadFileResult>;
  /** True when path exists (file or directory); false on ENOENT or permission errors. */
  exists(path: string): Promise<boolean>;
  /** True when path exists AND is a directory; false otherwise (including ENOENT). */
  isDirectory(path: string): Promise<boolean>;
  /** Single-stat alternative to exists+isDirectory. Returns null for missing paths. */
  statKind(path: string): Promise<'file' | 'directory' | null>;
  /** True when path equals OR is contained inside any configured root.
   *  Roots themselves are inclusive (the boundary). */
  isWithinRoots(path: string): boolean;
}
