export interface DirectoryEntry {
  name: string;
  path: string;
}

export type FileResult = { path: string; name: string; type: 'file' | 'directory' };

export type ReadFileResult = { content: string } | { error: string };

export interface FilesystemService {
  browseDirectories(path?: string): Promise<DirectoryEntry[]>;
  listFiles(cwd: string, pattern: string): Promise<FileResult[]>;
  readFile(cwd: string, filePath: string): Promise<ReadFileResult>;
}
