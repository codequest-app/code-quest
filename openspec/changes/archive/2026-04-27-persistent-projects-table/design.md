## Schema

```sql
-- apps/server/migrations/sqlite/0001_projects.sql
CREATE TABLE projects (
  id          TEXT PRIMARY KEY,         -- uuid
  path        TEXT NOT NULL UNIQUE,     -- absolute path (canonical project root)
  name        TEXT NOT NULL,            -- display name (default = basename(path), user-overridable)
  pinned      INTEGER NOT NULL DEFAULT 0,  -- 0/1 boolean
  color       TEXT,                     -- nullable hex color (#RRGGBB) for visual ID
  last_opened_at  TEXT NOT NULL,        -- ISO8601, updated on session.create
  created_at  TEXT NOT NULL
);
CREATE INDEX idx_projects_pinned ON projects(pinned, last_opened_at DESC);
```

```ts
// apps/server/src/db/schema-sqlite.ts (excerpt)
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  path: text('path').notNull().unique(),
  name: text('name').notNull(),
  pinned: integer('pinned', { mode: 'boolean' }).notNull().default(false),
  color: text('color'),
  lastOpenedAt: text('last_opened_at').notNull(),
  createdAt: text('created_at').notNull(),
});
```

MySQL version mirrors with `varchar(255)` for path, `tinyint` for pinned, `datetime` for timestamps.

## Identity

**Primary key**: `id` (uuid) — stable across renames/moves
**Unique key**: `path` (canonical absolute) — for upsert by path

Why uuid + unique path:
- uuid 讓「rename project」和「move project to different path」可能（之後加）
- unique path 確保 upsert 不會重複建立

## Sync Rules

### Session lifecycle → Project state

```
Session.create(cwd):
  1. Resolve projectRoot from cwd (gitService.getProjectRoot or fallback to cwd)
  2. ProjectStore.upsert({
       path: projectRoot,
       name: basename(projectRoot),  // only if creating new
       lastOpenedAt: now()
     })
  3. Emit projects:updated event to all clients

Session.delete:
  → No-op on projects (preserve metadata even when last session gone)
```

### Project mutations

```
Client.addProject(path):
  → server: upsert path; emit projects:added
  → client: optimistic update + reconcile on server response

Client.removeProject(id):
  → server: delete project (NOT cascade sessions; reject if has active sessions)
  → emit projects:removed

Client.updateProject(id, { name?, pinned?, color? }):
  → server: update fields
  → emit projects:updated
```

### Reject vs cascade decision

**Project.delete with active sessions → reject** (return error, don't delete).
Reasoning: Sessions are user's work-in-progress; silently dropping them is bad UX. User must close sessions first or use a "force delete" variant later.

## Socket Events

```ts
// packages/shared/src/projects/schemas.ts
export const EVENTS = {
  projects: {
    list: 'projects:list',          // request: () => Project[]
    add: 'projects:add',            // request: { path } => Project
    update: 'projects:update',      // request: { id, patch } => Project
    remove: 'projects:remove',      // request: { id } => void
    listed: 'projects:listed',      // emit: Project[]
    added: 'projects:added',        // emit: Project
    updated: 'projects:updated',    // emit: Project
    removed: 'projects:removed',    // emit: { id }
  },
};

export const projectSchema = z.object({
  id: z.string().uuid(),
  path: z.string(),
  name: z.string(),
  pinned: z.boolean(),
  color: z.string().nullable(),
  lastOpenedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
});
export type Project = z.infer<typeof projectSchema>;
```

## ProjectContext refactor

**Current shape (preserved)**:
```ts
interface ProjectContextValue {
  projects: Project[];
  activeProjectCwd: string | null;
  pendingActivateChannel: { cwd, channelId } | null;
  addProject: (cwd: string) => void;
  setActiveProject: (cwd: string) => void;
  requestActivateChannel: (cwd, channelId) => void;
}
```

**Internal change**: replace `useEffect` deriving from sessions with socket subscription.

```ts
// New internals
useEffect(() => {
  const unsubList = socket.on(EVENTS.projects.listed, (projs) => setProjects(projs));
  const unsubAdd = socket.on(EVENTS.projects.added, (proj) => setProjects(p => [...p, proj]));
  const unsubUpdate = socket.on(EVENTS.projects.updated, (proj) => setProjects(p => p.map(x => x.id === proj.id ? proj : x)));
  const unsubRemove = socket.on(EVENTS.projects.removed, ({ id }) => setProjects(p => p.filter(x => x.id !== id)));

  // Initial load
  socket.emit(EVENTS.projects.list, undefined, (projs) => setProjects(projs));

  return () => { unsubList(); unsubAdd(); unsubUpdate(); unsubRemove(); };
}, [socket]);
```

`addProject` 改為呼叫 server：
```ts
addProject: (cwd) => {
  socket.emit(EVENTS.projects.add, { path: cwd }, (proj) => {
    // Server emits projects:added → state already updated via subscription
    setActiveProjectCwd(proj.path);
  });
}
```

**Backwards compat**: 對外的 `Project` shape 仍然是 `{ cwd, name }`（用 `path` map 到 `cwd`），呼叫端不變。

## UI (Client) Detail

### ProjectContext refactor — internal data flow change

```
Before:
  SessionContext.sessions  ─derive→  setProjects(deriveFrom(sessions))
                                       ↓
                                     consumers (ProjectList, etc.)

After:
  socket: 'projects:listed'    ─→  setProjects(serverProjects)
  socket: 'projects:added'     ─→  setProjects(p => [...p, new])
  socket: 'projects:updated'   ─→  setProjects(p => p.map(...))
  socket: 'projects:removed'   ─→  setProjects(p => p.filter(...))
                                       ↓
                                     consumers (unchanged)
```

External shape preserved:
```ts
// Before & After (no change)
interface ProjectContextValue {
  projects: Project[];
  activeProjectCwd: string | null;
  pendingActivateChannel: { cwd; channelId } | null;
  addProject: (cwd: string) => void;
  setActiveProject: (cwd: string) => void;
  requestActivateChannel: (cwd, channelId) => void;
}

// Project shape — keep `cwd` and `name` for UI compat
interface Project {
  cwd: string;   // = server's `path` (renamed in adapter)
  name: string;
}
```

### Components affected

| File | Change | Reason |
|------|--------|--------|
| `ProjectList.tsx` | none | reads `projects` array unchanged |
| `ProjectCard.tsx` | none | reads `name` / `cwd` unchanged |
| `AddProjectDialog.tsx` | error handling | `addProject` may now fail (path not found) |
| `ProjectContext.tsx` | major (internals) | switch from derived to socket-backed |
| `WorkspaceLayout.tsx` | none | already adapted via `decouple-project-tab-context` |

### AddProjectDialog error flow

`addProject(path)` becomes async (was synchronous in-memory). Need to handle:

```
useProjectActions().addProject(path)
  ↓ (returns Promise<Project | { error }>)
  ↓
AddProjectDialog
  - on success → close dialog
  - on { error: 'path_not_found' }     → show toast "Path does not exist"
  - on { error: 'path_not_directory' } → show toast "Path is not a directory"
  - on socket disconnect → show toast + keep dialog open
```

Existing `AddProjectDialog` already has form state; just wire up async response handling.

### Loading state

Initial mount: `projects` is `[]` until `projects:listed` arrives. Add a brief loading indicator (or trust that the empty state is fast since it's a local socket call < 50ms).

```tsx
// ProjectContext provides:
const [loaded, setLoaded] = useState(false);
useEffect(() => {
  socket.emit(EVENTS.projects.list, undefined, (projs) => {
    setProjects(projs);
    setLoaded(true);
  });
}, [socket]);
```

Consumers can opt-in to `loaded` state. `ProjectList` can show skeleton or empty state — no breaking change.

### Optimistic vs server-confirmed updates

For `addProject`, **NOT optimistic** — wait for server confirmation:
- Path validation can fail on server side
- Optimistic add then rollback is bad UX
- Latency is < 50ms locally, acceptable

For `setActiveProject`, **optimistic** — pure UI state, no server roundtrip needed (same as today).

For future `update(name, pinned)`, **optimistic with rollback** — UI feels snappy.

### Socket subscription lifecycle

```ts
// ProjectContext.tsx (new)
useEffect(() => {
  if (!socket) return;

  // Initial load
  socket.emit(EVENTS.projects.list, undefined, (projs: Project[]) => {
    setProjects(projs.map(toUiProject));
  });

  // Live updates
  const handlers = {
    added: (p: ServerProject) => setProjects(prev => [...prev, toUiProject(p)]),
    updated: (p: ServerProject) => setProjects(prev =>
      prev.map(x => x.cwd === p.path ? toUiProject(p) : x)
    ),
    removed: ({ id, path }: { id: string; path: string }) =>
      setProjects(prev => prev.filter(x => x.cwd !== path)),
  };
  socket.on(EVENTS.projects.added, handlers.added);
  socket.on(EVENTS.projects.updated, handlers.updated);
  socket.on(EVENTS.projects.removed, handlers.removed);

  return () => {
    socket.off(EVENTS.projects.added, handlers.added);
    socket.off(EVENTS.projects.updated, handlers.updated);
    socket.off(EVENTS.projects.removed, handlers.removed);
  };
}, [socket]);
```

### Adapter helper

```ts
// keeps UI types stable
function toUiProject(p: ServerProject): Project {
  return { cwd: p.path, name: p.name };
}
```

This lets the change ship without touching ProjectList/ProjectCard. Future changes can extend `Project` to include `pinned/color/lastOpenedAt` once UI needs them (separate change).

### Multi-tab consistency

socket.io broadcasts `projects:added/updated/removed` to all sockets in the channel. Two browser tabs open: tab A adds project → tab B's ProjectContext receives event → list updates. No polling needed.

### Tests

```
apps/web/src/contexts/__tests__/ProjectContext.test.tsx
  - 'loads projects on mount via projects:list'
  - 'handles projects:added event by appending'
  - 'handles projects:updated by replacing matching cwd'
  - 'handles projects:removed by filtering'
  - 'addProject calls socket.emit projects:add and waits for response'
  - 'addProject surfaces error when server returns { error }'
  - 'cleans up socket listeners on unmount'

apps/web/src/components/__tests__/AddProjectDialog.test.tsx
  - existing tests pass (form behavior unchanged)
  - 'shows error toast when addProject returns path_not_found'  (NEW)
  - 'closes dialog on successful add'  (NEW or update existing)

apps/web/src/components/__tests__/ProjectList.test.tsx
  - existing tests pass (no behavior change)
```

Use `renderWithFakeServer` (or equivalent FakeSummoner client harness) to simulate socket emit/on.

## Migration / Backfill

Migration script:
```sql
-- 0001_projects.sql
CREATE TABLE projects (...);

-- backfill from existing sessions
INSERT INTO projects (id, path, name, pinned, color, last_opened_at, created_at)
SELECT
  lower(hex(randomblob(16))),  -- uuid-ish
  project_root,
  -- name = last segment of path
  CASE WHEN instr(project_root, '/') > 0
    THEN substr(project_root, length(project_root) - instr(reverse(project_root), '/') + 2)
    ELSE project_root
  END,
  0,
  NULL,
  COALESCE(MAX(created_at), datetime('now')),
  COALESCE(MIN(created_at), datetime('now'))
FROM sessions
WHERE project_root IS NOT NULL
GROUP BY project_root;
```

(MySQL version uses `UUID()` and `SUBSTRING_INDEX`.)

## ProjectAutoUpserter (Direction C — bridge service)

**Discovered during apply**: putting `projectStore.upsert` directly inside
`session/connect.ts` mixed concerns (session handler + project domain). Refactor:

```
session/connect.ts (onSessionInit)
  ├─ sessionStore.upsert(record)
  └─ projectAutoUpserter.onSessionCreated(projectRoot)  ← bridge

services/project-auto-upserter.ts
  - Holds projectStore + broadcaster (ChannelEmitter shape)
  - onSessionCreated(path):
      1. getByPath(path) — to know if it's new or existing
      2. upsert(path)
      3. broadcast projects:added (if new) or projects:updated
  - Failures logged not thrown (session lifecycle not blocked)

Why Direction C (vs A=decorator on SessionStore, B=event bus):
  - SessionStore + ProjectStore both stay pure persistence
  - Cross-store concern in one explicit place
  - All session-creation paths (init/fork/resume) get consistent sync via
    a one-line call
  - No new infrastructure needed (no event bus)
```

## MySQL key length (varchar 768, not 1024)

**Discovered during migrate run**: `varchar(1024)` × utf8mb4 (4 bytes/char)
= 4096 bytes exceeds InnoDB unique-index max of 3072 bytes. Lowered to 768
(3072/4 = 768) — still covers any realistic filesystem path.

## Migration generation

drizzle-kit's `generate` requires interactive TTY (asks
"create vs rename" for new tables). When running in agent / CI environments,
hand-write the SQL files following format in existing migrations + update
`_journal.json` manually. `meta/NNNN_snapshot.json` can be regenerated next
time someone runs `pnpm db:generate` interactively.

## addProject async API (final shape)

```ts
type AddProjectResult = Project | { error: string; path?: string };

interface ProjectActions {
  addProject: (cwd: string) => Promise<AddProjectResult>;
}
```

Callers:
- `WorkspaceLayout.handleAddProject` awaits, on `{ error }` shows
  `sonner.toast.error(...)` and keeps dialog open; on success closes dialog.
- `ProjectContext` itself sets `activeProjectCwd` immediately on success
  (snappy UI, before `projects:added` broadcast arrives).

## Test pattern: simulating server-pushed events

**Anti-pattern** (don't use):
```ts
summoner.socket.serverSocket.emit('projects:added', payload);  // ❌
```

**Right way** — use `FakeClaude.pushServerEvent`:
```ts
act(() => {
  summoner.claude().pushServerEvent('projects:added', payload);  // ✅
});
```

Documented in `.claude/skills/fake-summoner-client/SKILL.md` and
`.claude/skills/frontend-testing/references/fake-patterns.md`.

## Risks

1. **Race condition** on session.create + concurrent project upsert: solved by `INSERT OR IGNORE` (SQLite) / `INSERT ... ON DUPLICATE KEY` (MySQL). Path is unique key.

2. **Path normalization**: `~/foo` vs `/Users/x/foo` could create dupes. Always store canonical absolute path (resolve `~` and symlinks).

3. **Backfill on multi-dialect**: SQLite migration runs offline, MySQL runs in production. Test both.

4. **ProjectContext consumers**: existing components destructure `cwd` from project. Keep that field name in adapter even if internal model uses `path`.

5. **Pinning order**: when 0 pinned + sorted by lastOpenedAt, behavior is straightforward. When some pinned, ensure UI knows to render pinned first then recent.

## Path validation (FilesystemService.exists)

**Decision: validate path at handler layer (not in ProjectStore).**

ProjectStore stays pure persistence. The `projects:add` handler receives raw path from client and validates **before** upsert. Failure surfaces immediately to user instead of silent stale entry.

### Flow

```
projects:add { path } from client
  ↓
handler.canonicalize(path)  // ~/foo → /Users/x/foo
  ↓
filesystemService.exists(canonical) ?
  no  → cb({ error: 'path_not_found', path: canonical })
  yes ↓
filesystemService.isDirectory(canonical) ?
  no  → cb({ error: 'path_not_directory', path: canonical })
  yes ↓
projectStore.upsert(canonical) → Project
  ↓
emitter.broadcast(projects:added, project)
cb(project)
```

### FilesystemService interface change

```ts
// apps/summoner/src/filesystem/types.ts
export interface FilesystemService {
  browseDirectories(path?: string): Promise<DirectoryEntry[]>;
  listFiles(cwd: string, pattern: string): Promise<FileResult[]>;
  readFile(cwd: string, filePath: string): Promise<ReadFileResult>;
  exists(path: string): Promise<boolean>;        // ← NEW
  isDirectory(path: string): Promise<boolean>;   // ← NEW
}
```

`LocalFilesystemService` implements via `fs.promises.stat` + try/catch returning false on ENOENT.

### Why not in ProjectStore

- **Single Responsibility**: ProjectStore = "save / load projects rows". Filesystem checks belong elsewhere.
- **Testability**: ProjectStore can be tested with pure in-memory DB, no filesystem mocking.
- **Reusability**: Other handlers (e.g. future `projects:rename` if path moved) reuse the same validation; ProjectStore stays untouched.
- **Layering**: matches existing pattern (e.g. `git` handler holds GitService; GitService doesn't hold storage).

## Out of scope (later changes)

- Project archive (soft delete)
- Project workspaces (multi-folder)
- Project-level settings override (default model, default mode per project)
- Color/pin UI controls (just store the field; UI can come later)
- Recent projects palette (⌘P)
- `projects:rename` (move to different path)

These all consume the persistent-projects table but aren't required for this change to ship.
