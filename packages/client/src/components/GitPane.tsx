import {
  EVENTS,
  type GitAddResult,
  type GitCommitResult,
  type GitFileChange,
  type GitPushResult,
  gitAddResultSchema,
  gitCommitResultSchema,
  gitDiffByCwdResultSchema,
  gitPushResultSchema,
} from '@code-quest/shared';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useGitActions, useGitStatus } from '../contexts/GitContext';
import { useSocket } from '../contexts/SocketContext';
import { useAsyncAction } from '../hooks/useAsyncAction';
import { useKeepFsWatcherAlive } from '../hooks/useKeepFsWatcherAlive';
import { rpc } from '../socket/rpc';
import { cn } from '../utils/cn';
import { type DiffFile, parseUnifiedDiff } from '../utils/parse-unified-diff';
import { BranchSection } from './BranchSection';
import { CommitComposer } from './CommitComposer';
import { DiffModal } from './DiffModal';
import { EmptyState } from './EmptyState';
import { ActionButton } from './ui/ActionButton';
import { CommandHint } from './ui/CommandHint';
import { PaneStatusFooter } from './ui/PaneStatusFooter';
import { Spinner } from './ui/Spinner';

export interface GitPaneProps {
  cwd: string;
}

const STATUS_LABEL: Record<string, { mark: string; cls: string }> = {
  M: { mark: 'M', cls: 'text-warning' },
  A: { mark: 'A', cls: 'text-success' },
  D: { mark: 'D', cls: 'text-danger' },
  R: { mark: 'R', cls: 'text-info' },
  '??': { mark: '?', cls: 'text-success/70' },
  U: { mark: 'U', cls: 'text-success/70' },
};

function statusFor(s: string): { mark: string; cls: string } {
  return STATUS_LABEL[s] ?? { mark: s.slice(0, 1) || '·', cls: 'text-text-muted' };
}

export function GitPane({ cwd }: GitPaneProps) {
  const { socket } = useSocket();
  const { checkout, discardFile, fetch, listBranches, pull, refetchGitStatus } = useGitActions();
  const data = useGitStatus(cwd);
  useKeepFsWatcherAlive(cwd);
  const refetch = useCallback(() => refetchGitStatus(cwd), [cwd, refetchGitStatus]);
  const [diffFile, setDiffFile] = useState<DiffFile | null>(null);
  const [branchPopoverOpen, setBranchPopoverOpen] = useState(false);
  const [branches, setBranches] = useState<string[]>([]);

  async function handleBranchOpenChange(open: boolean) {
    setBranchPopoverOpen(open);
    if (open) {
      const res = await listBranches(cwd);
      setBranches(Array.isArray(res) ? res : []);
    }
  }

  // ── Inner async actions (declared before useAsyncAction wraps; function
  //    declarations are hoisted so order doesn't matter at runtime — but
  //    they MUST be declared before the early returns to keep hook order
  //    stable across renders). ──
  async function stageAll() {
    const response = await rpc(socket, EVENTS.git.add, { cwd });
    const parsed = gitAddResultSchema.safeParse(response);
    const result: GitAddResult = parsed.success ? parsed.data : { error: 'Invalid response' };
    if ('error' in result) toast.error(`Stage failed: ${result.error}`);
    else toast.success('Staged all changes');
    await refetch();
  }

  async function commit(message: string) {
    const response = await rpc(socket, EVENTS.git.commit, { cwd, message });
    const parsed = gitCommitResultSchema.safeParse(response);
    const result: GitCommitResult = parsed.success ? parsed.data : { error: 'Invalid response' };
    if ('error' in result) {
      if (result.error === 'nothing-to-commit') {
        toast('Nothing to commit. Stage first.');
      } else {
        toast.error(`Commit failed: ${result.error}`);
      }
      return;
    }
    toast.success(`Committed ${result.hash.slice(0, 7)}`);
    await refetch();
  }

  async function runFetch() {
    const result = await fetch(cwd);
    if ('error' in result) toast.error(`Fetch failed: ${result.error}`);
    else toast.success('Fetched');
  }

  async function runPull() {
    const result = await pull(cwd);
    if ('error' in result) {
      if (result.error === 'non-ff') {
        toast('Pull rejected (non-FF). Run `git pull --rebase` manually.');
      } else if (result.error === 'no-upstream') {
        toast('No upstream — set one with `git push -u`');
      } else {
        toast.error(`Pull failed: ${result.error}`);
      }
      return;
    }
    toast.success(result.fastForwarded ? 'Pulled' : 'Already up to date');
    await refetch();
  }

  async function push() {
    const response = await rpc(socket, EVENTS.git.push, { cwd });
    const parsed = gitPushResultSchema.safeParse(response);
    const result: GitPushResult = parsed.success ? parsed.data : { error: 'Invalid response' };
    if ('error' in result) {
      if (result.error === 'no-upstream') toast('No upstream — set one with git push -u');
      else if (result.error === 'rejected') toast('Push rejected (non-FF). Pull first.');
      else toast.error(`Push failed: ${result.error}`);
      return;
    }
    toast.success('Pushed');
  }

  async function openDiff(filePath: string) {
    const response = await rpc(socket, EVENTS.git.diff, { cwd });
    const parsed = gitDiffByCwdResultSchema.safeParse(response);
    if (!parsed.success) {
      toast.error('Diff unavailable: invalid response');
      return;
    }
    if ('error' in parsed.data) {
      toast.error(`Diff failed: ${parsed.data.error}`);
      return;
    }
    const files = parseUnifiedDiff(parsed.data.diff);
    const match = files.find((f) => f.path === filePath);
    setDiffFile(
      match ?? {
        path: filePath,
        isBinary: false,
        added: 0,
        removed: 0,
        lines: [{ kind: 'meta', text: 'No diff available.' }],
      },
    );
  }

  const stageAction = useAsyncAction(stageAll);
  const fetchAction = useAsyncAction(runFetch);
  const pullAction = useAsyncAction(runPull);
  const pushAction = useAsyncAction(push);

  // ── Early returns (must follow ALL hook calls above) ──
  if (data && 'notARepo' in data) {
    return (
      <EmptyState
        icon={
          <span className="text-4xl text-accent" aria-hidden>
            ⎇
          </span>
        }
        message="Not a git repository."
        hint={<CommandHint command="git init" />}
      />
    );
  }
  if (data && 'error' in data) {
    return <EmptyState message={data.error} />;
  }
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-2 text-text-muted">
        <Spinner className="w-5 h-5" />
        <span className="text-sm">Loading…</span>
      </div>
    );
  }

  // After the early returns above, `data` is the success branch — drop the
  // dead defensive narrowing.
  const status = data;
  const hasChanges = !status.isClean;
  const changedCount = status.changedFiles.length;
  const ahead = status.ahead ?? 0;
  const behind = status.behind ?? 0;

  return (
    <div className="flex flex-col h-full" data-testid="git-pane">
      <div className="flex-1 min-h-0 overflow-auto">
        <BranchSection
          status={status}
          branches={branches}
          popoverOpen={branchPopoverOpen}
          onPopoverOpenChange={handleBranchOpenChange}
          onSelectBranch={async (branch) => {
            const res = await checkout(cwd, branch);
            if (!res.ok) toast.error(`Checkout failed: ${res.error}`);
            else toast.success(`Switched to ${res.branch}`);
          }}
        />

        {/* Changes section — flows naturally; pane scrolls as one. */}
        <section className="px-3 py-2 border-b border-border text-sm">
          <SectionHeader title={`Changes (${changedCount})`}>
            {hasChanges && (
              <button
                type="button"
                className="text-xs text-accent hover:underline disabled:opacity-50 inline-flex items-center gap-1"
                disabled={stageAction.pending}
                onClick={() => void stageAction.run()}
              >
                {stageAction.pending && <Spinner className="w-3 h-3" />}
                Stage all
              </button>
            )}
          </SectionHeader>
          <ChangedFiles files={status.changedFiles} onPick={openDiff} />
          {hasChanges && (
            <CommitComposer onCommit={(msg) => void commit(msg)} count={changedCount} />
          )}
        </section>

        {/* Actions section — sits right under Changes content, not pinned. */}
        <section className="px-3 py-2">
          <SectionHeader title="Actions" />
          <div className="flex gap-2 text-xs">
            <ActionButton action={fetchAction} label="Fetch" />
            <ActionButton action={pullAction} label="Pull" />
            <ActionButton action={pushAction} label="Push" />
          </div>
        </section>
      </div>
      <PaneStatusFooter>
        <span>{status.branch ?? 'unknown'}</span>
        <span>·</span>
        <span>
          {changedCount} {changedCount === 1 ? 'change' : 'changes'}
        </span>
        {(ahead > 0 || behind > 0) && (
          <>
            <span>·</span>
            {ahead > 0 && <span>↑{ahead}</span>}
            {behind > 0 && <span>↓{behind}</span>}
          </>
        )}
      </PaneStatusFooter>
      {diffFile &&
        (() => {
          const fileStatus = status.changedFiles.find((f) => f.file === diffFile.path)?.status;
          const canDiscard = fileStatus !== undefined && fileStatus !== '??';
          return (
            <DiffModal
              file={diffFile}
              onClose={() => setDiffFile(null)}
              canDiscard={canDiscard}
              onDiscard={async () => {
                const result = await discardFile(cwd, diffFile.path);
                if ('error' in result) toast.error(`Discard failed: ${result.error}`);
                else {
                  toast.success(`Discarded ${diffFile.path}`);
                  setDiffFile(null);
                }
              }}
            />
          );
        })()}
    </div>
  );
}

function SectionHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-1">
      <h4 className="section-label m-0">{title}</h4>
      {children}
    </div>
  );
}

function ChangedFiles({
  files,
  onPick,
}: {
  files: GitFileChange[];
  onPick: (path: string) => void;
}) {
  if (files.length === 0) {
    return <div className="text-text-muted text-xs px-1">No changes</div>;
  }
  return (
    <ul className="flex flex-col">
      {files.map((f) => {
        const { mark, cls } = statusFor(f.status);
        return (
          <li key={f.file}>
            <button
              type="button"
              className="flex items-center gap-2 w-full text-left px-1 py-0.5 hover:bg-white/5 rounded"
              onClick={() => onPick(f.file)}
            >
              <span className={cn('font-mono w-4 text-xs', cls)}>{mark}</span>
              <span className="font-mono text-xs truncate">{f.file}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
