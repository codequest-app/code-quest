# Design: project-menu-resume

## Context

Three needs converge in this change:

1. **Project-scoped resume UX.** After Step 1, dead sessions cannot be resumed at all. Users need a discoverable entry point scoped to the current project.
2. **Provider, not bare hook.** A naked `useResume()` hook works today but leaves no seam for inflight indicators, progress events, cross-surface toasts. Picking Provider now means those arrive without breaking callers.
3. **List filter must exclude live sessions.** A picker that shows already-alive channels is actively harmful — picking one would either no-op or trigger a second concurrent CLI against the same JSONL (corruption). The filter belongs at the handler/store, not per caller.

## Decisions

### 1. Dedicated `session:resume` event (NOT overloading `session:launch`)

A new C2S RPC event `session:resume` with payload `{ sessionId: string }` and ack callback `{ channelId?: string; error?: string }`.

**Why a dedicated event:**

- **Distinct semantics.** Launch creates a brand-new session (no sessionId yet). Resume targets an existing sessionId and has a reuse-alive branch launch never takes. Collapsing them forces every `handleLaunch` call site to reason about whether `resumeSessionId` is set.
- **Cleaner payload shape.** Resume REQUIRES `sessionId`; launch MUST NOT carry one. A single schema either makes `sessionId` required (breaks launch) or optional (pushes runtime branching everywhere).
- **Symmetry with the retired wire name.** `remove-broken-resume` deleted a broadcast-shaped `session:resume`. We reuse the wire name but as a C2S RPC with ack — no broadcast.
- **Test isolation.** Launch tests and resume tests never cross-contaminate. `handleLaunch` stays frozen; `handleResume` evolves independently.

**Alternatives rejected:**

- _Overload `session:launch` with optional `resumeSessionId`._ Considered and rejected. Two distinct user intents routed through one handler bloats the launch path with conditionals and mixes failure modes (dead-session error vs launch-config error).
- _Re-broadcast `session:resume` as in the deleted version._ Broadcasts don't carry ack callbacks; the client needs the resolved channelId synchronously to open a tab.

### 2. `handleResume` lives in `connect.ts` beside `handleLaunch`

Both functions manage channel-lifecycle entry points. Splitting into a second file duplicates shared wiring (spawn helpers, `onSessionInit`, error plumbing) without meaningful separation. Keep them siblings; register both from the same module.

### 3. ResumeProvider + useResume (not a bare hook)

v1 internal logic is pure RPC (`emit session:resume { sessionId }`, safeParse response, resolve/reject). But the Provider shape is chosen deliberately:

- **Future-proof without caller churn.** When we add inflight state, server-pushed progress events, or a cross-surface "resuming…" indicator, `useResume()` grows additively; no call site migrates.
- **Single subscription seam.** If/when server broadcasts `session:resume_progress`, the Provider owns exactly one `socket.on`.

**v1 contract (NO state, NO subscription):**

```ts
interface ResumeContextValue {
  resume: (sessionId: string) => Promise<{ channelId: string }>;
}
```

`resume(sessionId)` emits `session:resume { sessionId }`, `sessionResumeResponseSchema.safeParse`s the callback, resolves with `{ channelId }` or rejects with `Error(response.error)`.

### 4. ResumePicker is a shared component, not a hook

```ts
interface ResumePickerProps {
  cwd?: string;
  onResume: (channelId: string) => void;
  onCancel: () => void;
}
```

Owns its own loading/list/error/picking state. On mount calls `useSession().listSessions({ cwd, limit: 50, excludeLive: true })`. On row click → `useResume().resume(row.id)` → `onResume(channelId)`; on reject → inline error; row unlocks.

Empty states:
- `cwd` present → `"No resumable sessions for this project."`
- `cwd` absent → `"No resumable sessions."`

### 5. excludeLive filters at the store layer (DB-level NOT IN)

`sessionListPayloadSchema.excludeLive?: boolean` (default `false`). `query.handleList`:

1. Reads `excludeLive`.
2. If true, computes `aliveSessionIds = channelManager.aliveChannels().map(c => c.sessionId).filter(Boolean)`.
3. Passes `excludeSessionIds: aliveSessionIds` into `sessionStore.list(...)`.

`DrizzleSessionStore.list` appends `notInArray(sessions.id, excludeSessionIds)` to the WHERE clause ONLY when the array is non-empty. Empty array bypasses the filter entirely — this avoids the `NOT IN ()` SQL hazard (invalid in most dialects / always-false in others).

`CompositeSessionStore` passes through.

**Why store-level, not post-DB filter:** `total` stays accurate; pagination doesn't drift. Runtime knowledge (which channels are alive) is still composed in the handler, then passed as data into the store — the store never imports ChannelManager.

### 6. ChannelManager gains two helpers (not one)

```ts
aliveChannels(): Channel[]
findAliveBySessionId(sessionId: string): Channel | undefined
```

- `aliveChannels()` — used by the list-filter path; wants the full set.
- `findAliveBySessionId()` — used by the reuse branch in `handleResume`; single lookup, clearer intent.

Existing `getAliveChannels()` returns tuples and stays as-is.

### 7. handleResume flow

```
session:resume { sessionId }
├─ findAliveBySessionId(sessionId)
│   ├─ hit  → callback({ channelId: existing.channelId }); RETURN (no spawn)
│   └─ miss → channelManager.create(newChannelId, { launchOptions: { resumeSessionId: sessionId, ... } })
│            on success  → finalizeAndNotify (onSessionInit upserts row keyed by sessionId w/ new channelId)
│            on "No conversation found" → sessionStore.updateStatus(sessionId, 'dead'); error callback
```

Explicit rejection: do NOT spawn a second concurrent CLI for the same sessionId. The Claude CLI appends to a per-session JSONL; two processes racing on the same file corrupt it.

**CLI stability note (verified 2.1.104):** `claude --resume <sid>` reports the SAME sessionId in the `system:init` event, and the sessionId is stable across multi-turn stream-json turns after resume. The DB row keyed by sessionId is therefore stable across resume cycles; only the `channelId` column rotates to the new wrapper. `onSessionInit` upsert semantics (from `rename-drizzle-persist-to-upsert`) are sufficient — no bespoke resume-write path needed.

### 8. Right-click menu — lightweight, NOT Radix ContextMenu

One menu item ("Resume session…"). Fixed-position `<div>` with outside-click + Escape handlers. Upgrade to Radix when we add a second item.

### 9. ResumeSessionsDialog wires to tabs

`handleResume(channelId)` inside the dialog: `setActiveProject(project.cwd)` and close. The project's existing `TabProvider` (mounted per-project inside `WorkspaceLayout`) will surface the new channel via its `sessions` prop once `session:states` broadcasts — no explicit `addTab` from the sidebar.

**`addTab` reach-around:** `TabProvider` is mounted per-project inside `WorkspaceLayout`, so `useTabActions()` is not reachable from `ProjectCard` in the sidebar. v1 relies on the `session:states`-driven refresh. If latency is visible, upgrade to an `useOpenTabIntent` channel at workspace level.

### 10. ProjectContext owns a `pendingActivateChannel` intent for cross-tree activation

**Context.** `TabProvider` is mounted per-project inside `WorkspaceLayout`. Its existing `useEffect` on the `sessions` prop auto-calls `addTab(channelId)` when a new alive channel appears. But `addTab` only sets `activeTabId` when no tab is currently active (`activeTabId: prev.activeTabId ?? id`). So a freshly-resumed channel appears as a tab without activating, and the reuse path returns an existing channelId that is already a tab — also not auto-activated. `ResumeSessionsDialog` lives in the sidebar subtree (under `ProjectList`), outside any `TabProvider`, so it cannot directly call `useTabActions().setActiveTab(channelId)`.

**Chosen.** Add a `pendingActivateChannel` intent to `ProjectContext`:

```ts
// ProjectContext state additions
pendingActivateChannel: { cwd: string; channelId: string } | null

// ProjectContext actions additions
requestActivateChannel(cwd: string, channelId: string): void
clearPendingActivate(): void
```

`TabProvider` gains a `useEffect` that watches `pendingActivateChannel` from `useProjectState()`:
- if `pendingActivateChannel?.cwd === own cwd` AND `pendingActivateChannel.channelId in tabs` → call `setActiveTab(pendingActivateChannel.channelId)` then `clearPendingActivate()`.

`ResumeSessionsDialog.handleResume(channelId)`:

```ts
setActiveProject(project.cwd);
requestActivateChannel(project.cwd, channelId);
close();
```

The intent fires once, the right `TabProvider` consumes it, the rest is reactive.

**Alternatives rejected:**

- _Lift `TabProvider` above `ProjectList`._ Breaks per-project tab isolation (each project currently owns its own tab map + `activeTabId`, preserved across project switches like VSCode workspaces). Lifting forces a global active tab across all projects, or relocates the problem into a `Map<cwd, string>` internal state. Not a refactor — a different architecture.
- _Mount the dialog inside a project's pane._ Convoluted: sidebar trigger but dialog elsewhere; would need cross-tree coordination (essentially the same pattern, worse).
- _Custom event / ref bridge._ Not React-idiomatic, brittle.

The chosen solution matches:
- Existing isolation boundary (per-project tabs).
- Existing data flow (`ProjectContext` mediates cross-project state; `TabProvider` is reactive to its slice).
- Existing `TabProvider` pattern (already reacts to `sessions` prop via effect; one more effect on a related intent is in-pattern).

## Risks

- **Symlinked cwds:** `/foo` vs `/private/foo` produce duplicate ProjectCards. Out of scope.
- **Dead-path detection via string match:** `message.includes('No conversation found')` is brittle. Unchanged from existing code; structured error codes are a separate change.
- **`excludeSessionIds` growing unbounded:** in practice alive channel count is <50. `notInArray` with hundreds of IDs is fine for SQLite/MySQL; revisit if channel counts explode.
- **pendingActivate race (Decision 10):** the intent may be set before the resumed channel appears in `tabs` (auto-`addTab` waits for the `session:states` broadcast). The `TabProvider` effect MUST NOT clear `pendingActivate` in that case — clear ONLY when it actually called `setActiveTab`. Otherwise the activation is silently lost.
- **Stale pendingActivate (Decision 10):** user opens picker, picks a session, then manually switches tabs before activation completes — the effect would override the manual choice. Mitigation: the pending is consumed on first match, so subsequent renders don't fight the user. Initial activation race is acceptable v1 behavior.

## Out of scope

- `fork.ts` / `teleport.ts` passing channelId where runner expects sessionId (pre-existing latent bug).
- Generalizing `ChannelManager.create()` channelId↔sessionId bridge invariant.
- ChatPanel `/resume` slash-command reintroduction (Step 3).
- cwd canonicalization / symlink dedupe.
- Structured dead-session error codes.
