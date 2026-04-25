import { ChevronDownIcon, FolderIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useEffect, useRef, useState } from 'react';
import type { Project } from '../contexts/ProjectContext';
import { basename } from '../utils/basename';
import { cn } from '../utils/cn';

function displayName(p: Project): string {
  if (p.name.includes('/')) return basename(p.name);
  return p.name || basename(p.cwd);
}

function byLastOpenedDesc(a: Project, b: Project): number {
  return a.lastOpenedAt < b.lastOpenedAt ? 1 : -1;
}

function matchesSearch(p: Project, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  return displayName(p).toLowerCase().includes(needle) || p.cwd.toLowerCase().includes(needle);
}

export function TopScopeSwitcher({
  projects,
  activeProjectCwd,
  onSelect,
  onAddProject,
}: {
  projects: Project[];
  activeProjectCwd: string | null;
  onSelect: (cwd: string) => void;
  onAddProject: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  const active = projects.find((p) => p.cwd === activeProjectCwd) ?? null;

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) setSearch('');
  }, [open]);

  const filtered = projects.filter((p) => matchesSearch(p, search));
  const pinned = filtered.filter((p) => p.pinned).sort(byLastOpenedDesc);
  const recent = filtered.filter((p) => !p.pinned).sort(byLastOpenedDesc);

  function handleSelect(cwd: string) {
    onSelect(cwd);
    setOpen(false);
  }

  function handleAdd() {
    onAddProject();
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-border bg-surface hover:border-accent text-text text-xs font-medium"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <FolderIcon className="w-3.5 h-3.5 text-text-muted" />
        <span className="truncate max-w-50">
          {active ? displayName(active) : 'No project selected'}
        </span>
        <ChevronDownIcon className="w-3.5 h-3.5 text-text-muted" />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-1 w-72 z-modal rounded border border-border bg-surface shadow-lg flex flex-col max-h-96"
          role="listbox"
        >
          <div className="p-2 border-b border-border">
            <input
              type="search"
              placeholder="Search projects…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-2 py-1 text-sm rounded bg-bg border border-border text-text outline-none focus:border-accent"
            />
          </div>

          <div className="flex-1 overflow-auto py-1">
            {pinned.length === 0 && recent.length === 0 ? (
              <div className="px-3 py-4 text-sm text-text-muted text-center">No matches</div>
            ) : null}

            {pinned.length > 0 && (
              <>
                <div className="px-3 pt-1 pb-0.5 text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Pinned
                </div>
                {pinned.map((p) => (
                  <ScopeItem
                    key={p.cwd}
                    project={p}
                    active={p.cwd === activeProjectCwd}
                    onSelect={handleSelect}
                  />
                ))}
              </>
            )}

            {recent.length > 0 && (
              <>
                <div className="px-3 pt-2 pb-0.5 text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Recent
                </div>
                {recent.map((p) => (
                  <ScopeItem
                    key={p.cwd}
                    project={p}
                    active={p.cwd === activeProjectCwd}
                    onSelect={handleSelect}
                  />
                ))}
              </>
            )}
          </div>

          <div className="border-t border-border p-1">
            <button
              type="button"
              onClick={handleAdd}
              className="w-full text-left px-3 py-1.5 rounded text-sm text-accent hover:bg-accent/10 flex items-center gap-1.5"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              Add project
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ScopeItem({
  project,
  active,
  onSelect,
}: {
  project: Project;
  active: boolean;
  onSelect: (cwd: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(project.cwd)}
      title={project.cwd}
      className={cn(
        'w-full text-left px-3 py-1 text-sm flex items-center gap-1.5',
        active ? 'text-accent bg-accent/10' : 'text-text hover:bg-white/5',
      )}
    >
      <FolderIcon className="w-3.5 h-3.5 shrink-0 text-text-muted" />
      <span className="truncate flex-1">{displayName(project)}</span>
    </button>
  );
}
