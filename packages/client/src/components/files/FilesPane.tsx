import { type MouseEvent, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useFsActions } from '@/contexts/FsContext';
import { useGitStatus } from '@/contexts/GitContext';
import { useKeepFsWatcherAlive } from '@/hooks/useKeepFsWatcherAlive';
import { EmptyState } from '../workspace/EmptyState';
import { FilePreviewModal } from './FilePreviewModal';
import { FileTree } from './FileTree';

export interface FilesPaneProps {
  cwd: string;
  onMention: (path: string) => void;
}

export function FilesPane({ cwd, onMention }: FilesPaneProps): React.JSX.Element {
  const [previewPath, setPreviewPath] = useState<string | null>(null);
  const [rootError, setRootError] = useState<string | null>(null);
  const { browse } = useFsActions();
  const gitData = useGitStatus(cwd);
  useKeepFsWatcherAlive(cwd);

  // Probe the cwd once per change to surface "outside allowed roots" (and any
  // other early errors) as a clear empty state instead of a blank tree. The
  // FileTree's own dataLoader fetches in parallel; this probe is the first
  // signal that lets the pane render an error message.
  useEffect(() => {
    let cancelled = false;
    setRootError(null);
    void browse(cwd).then((res) => {
      if (cancelled) return;
      if ('error' in res) setRootError(res.error);
    });
    return () => {
      cancelled = true;
    };
  }, [cwd, browse]);

  const gitMarks = useMemo(() => {
    const m = new Map<string, string>();
    if (gitData && 'changedFiles' in gitData) {
      // POSIX-only path joining — server emits forward-slash paths from git
      // status (`f.file` is repo-relative) and FileTree's absolute paths
      // (server fs:browse) likewise use `/`. Strip a trailing slash on cwd
      // to avoid double-slash when cwd is a root like '/'.
      const normalizedCwd = cwd.endsWith('/') ? cwd.slice(0, -1) : cwd;
      for (const f of gitData.changedFiles) {
        m.set(`${normalizedCwd}/${f.file}`, f.status);
      }
    }
    return m;
  }, [gitData, cwd]);

  function handleActivate(path: string, event: MouseEvent<Element>) {
    if (event.metaKey || event.ctrlKey) {
      onMention(path);
      return;
    }
    if (event.altKey) {
      toast('Open in editor — coming soon');
      return;
    }
    setPreviewPath(path);
  }

  if (rootError) {
    return <EmptyState message={rootError} />;
  }

  return (
    <section className="flex flex-col h-full" aria-label="files-pane">
      <div className="flex-1 min-h-0 overflow-auto">
        <FileTree
          key={cwd}
          rootCwd={cwd}
          showHidden
          gitMarks={gitMarks}
          onActivate={handleActivate}
        />
      </div>
      {previewPath && (
        <FilePreviewModal
          path={previewPath}
          onMention={(p) => {
            onMention(p);
            setPreviewPath(null);
          }}
          onClose={() => setPreviewPath(null)}
        />
      )}
    </section>
  );
}
