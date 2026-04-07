export interface DirectoryEntry {
  name: string;
  path: string;
}

export type FileResult = { path: string; name: string; type: 'file' | 'directory' };

export type ReadFileResult = { content: string } | { error: string };

export interface FilesystemService {
  browseDirectories(path?: string): DirectoryEntry[];
  listFiles(cwd: string, pattern: string): FileResult[];
  readFile(cwd: string, filePath: string): ReadFileResult;
}
