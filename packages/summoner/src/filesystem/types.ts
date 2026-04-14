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

export const readFileResultSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('ok'), content: z.string() }),
  z.object({ kind: z.literal('err'), error: z.string() }),
]);

/** Legacy tagless variant — consumers narrow by `'error' in result`. */
export type ReadFileResult = { content: string } | { error: string };

export interface FilesystemService {
  browseDirectories(path?: string): Promise<DirectoryEntry[]>;
  listFiles(cwd: string, pattern: string): Promise<FileResult[]>;
  readFile(cwd: string, filePath: string): Promise<ReadFileResult>;
}
