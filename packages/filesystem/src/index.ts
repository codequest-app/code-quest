export { LocalFilesystemService } from './local.ts';
export { LocalRootGuard } from './local-root-guard.ts';
export { RemoteFilesystemService } from './remote.ts';
export type {
  DirectoryEntry,
  FileKind,
  FileResult,
  FilesystemService,
  FsMutationResult,
  ReadFileAbsoluteResult,
  ReadFileResult,
  RootGuard,
  WriteFileResult,
} from './types.ts';
export { PathOutsideRootsError } from './types.ts';
