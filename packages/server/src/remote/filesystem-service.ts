import type {
  DirectoryEntry,
  FileKind,
  FileResult,
  FilesystemService,
  FsMutationResult,
  ReadFileAbsoluteResult,
  ReadFileResult,
  WriteFileResult,
} from '@code-quest/shared';
import { REMOTE_METHODS } from '@code-quest/shared';
import type { Connection } from './connection.ts';

export class RemoteFilesystemService implements FilesystemService {
  private readonly connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  async browseDirectories(path?: string): Promise<DirectoryEntry[]> {
    const res = await this.connection.request<{ entries: DirectoryEntry[] }>(
      REMOTE_METHODS.fs.browseDirectories,
      { path },
    );
    return res.entries;
  }

  async browseEntries(
    path?: string,
    opts?: { showHidden?: boolean },
  ): Promise<{ directories: DirectoryEntry[]; files: DirectoryEntry[] }> {
    return this.connection.request(REMOTE_METHODS.fs.browseEntries, {
      path,
      showHidden: opts?.showHidden,
    });
  }

  readFileAbsolute(absolutePath: string): Promise<ReadFileAbsoluteResult> {
    return this.connection.request(REMOTE_METHODS.fs.readFileAbsolute, { absolutePath });
  }

  async writeFileAbsolute(absolutePath: string, content: string): Promise<WriteFileResult> {
    return this.connection.request(REMOTE_METHODS.fs.writeFileAbsolute, { absolutePath, content });
  }

  create(absolutePath: string, kind: FileKind): Promise<FsMutationResult> {
    return this.connection.request(REMOTE_METHODS.fs.create, { absolutePath, kind });
  }

  delete(absolutePath: string): Promise<FsMutationResult> {
    return this.connection.request(REMOTE_METHODS.fs.delete, { absolutePath });
  }

  rename(from: string, to: string): Promise<FsMutationResult> {
    return this.connection.request(REMOTE_METHODS.fs.rename, { from, to });
  }

  copy(from: string, to: string): Promise<FsMutationResult> {
    return this.connection.request(REMOTE_METHODS.fs.copy, { from, to });
  }

  move(from: string, to: string): Promise<FsMutationResult> {
    return this.connection.request(REMOTE_METHODS.fs.move, { from, to });
  }

  async listFiles(cwd: string, pattern: string): Promise<FileResult[]> {
    const res = await this.connection.request<{ files: FileResult[] }>(REMOTE_METHODS.fs.list, {
      cwd,
      pattern,
    });
    return res.files;
  }

  readFile(cwd: string, filePath: string): Promise<ReadFileResult> {
    return this.connection.request(REMOTE_METHODS.fs.read, { cwd, filePath });
  }

  async exists(path: string): Promise<boolean> {
    const res = await this.connection.request<{ exists: boolean }>(REMOTE_METHODS.fs.exists, {
      path,
    });
    return res.exists;
  }

  async isDirectory(path: string): Promise<boolean> {
    const res = await this.connection.request<{ isDirectory: boolean }>(
      REMOTE_METHODS.fs.isDirectory,
      { path },
    );
    return res.isDirectory;
  }

  async statKind(path: string): Promise<FileKind | null> {
    const res = await this.connection.request<{ kind: FileKind | null }>(
      REMOTE_METHODS.fs.statKind,
      { path },
    );
    return res.kind;
  }
}
