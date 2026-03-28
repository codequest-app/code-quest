# Gap Analysis Round 4 — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement remaining protocol/UI gaps identified by comparing `docs/ui` (9 files) and `docs/protocol` (33 files) against the codebase.

**Architecture:** Web-based (Express + Socket.IO + React + Zustand). CLI interaction via `InteractiveSession` in `summoner`. All features follow existing patterns: Zod schemas in `shared`, socket handlers in `server`, hooks + components in `client`.

**Tech Stack:** TypeScript, Vitest, Zod, Socket.IO, Express, Zustand, React, supertest

---

## Already Complete (skip)

| ID | Feature | Status |
|----|---------|--------|
| G4 | Notification Action Buttons | ✅ NotificationToast supports multi-button |
| G10 | Rate Limit Inline Indicator | ✅ RateLimitContent in ChatMessage |
| G11 | Streamlined Rendering | ✅ Parsed + rendered in ChatMessage |
| G13 | Remote Control Toggle | ✅ HeaderBar + store + socket event |

---

## Wave 1 — Small, No Dependencies (parallel)

### Task 1: G5 — Multi-Strategy Git Checkout

**Files:**
- Modify: `packages/server/src/socket/chat-handler.ts` (git:checkout handler)
- Modify: `packages/server/src/__tests__/chat-handler.test.ts`

**Context:** Current `git:checkout` runs a single `git checkout <branch>`. Protocol 07o specifies 4 fallback strategies: local → fetch+checkout → track origin → --track origin.

**Step 1: Write failing test**

In `chat-handler.test.ts`, add a test group for git checkout strategies:

```typescript
describe('git:checkout multi-strategy', () => {
  it('should try fetch+checkout when local checkout fails', async () => {
    // Mock execFile to fail on first call (local), succeed on second (fetch+checkout)
    const execFileMock = vi.fn()
      .mockRejectedValueOnce(new Error('pathspec did not match'))
      .mockResolvedValueOnce({ stdout: '', stderr: '' }) // git fetch
      .mockResolvedValueOnce({ stdout: '', stderr: '' }); // git checkout

    // ... setup socket, emit git:checkout { branch: 'feature/remote-only' }
    // assert execFileMock called 3 times (checkout, fetch, checkout)
    // assert callback { success: true }
  });

  it('should try --track origin when fetch+checkout fails', async () => {
    const execFileMock = vi.fn()
      .mockRejectedValueOnce(new Error('pathspec did not match'))
      .mockRejectedValueOnce(new Error('fetch failed'))
      .mockResolvedValueOnce({ stdout: '', stderr: '' }); // git checkout --track origin/branch

    // assert callback { success: true }
  });

  it('should return error when all strategies fail', async () => {
    const execFileMock = vi.fn()
      .mockRejectedValue(new Error('failed'));

    // assert callback { success: false, error: contains 'failed' }
  });
});
```

**Step 2: Run test, verify FAIL**

```bash
cd packages/server && npx vitest run --reporter verbose -t "git:checkout multi-strategy"
```

**Step 3: Implement multi-strategy checkout**

In `chat-handler.ts`, replace the single `git checkout` with:

```typescript
// Strategy 1: local checkout
// Strategy 2: git fetch origin && git checkout <branch>
// Strategy 3: git checkout --track origin/<branch>
```

Each strategy catches the error and falls through to the next.

**Step 4: Run test, verify PASS**

```bash
cd packages/server && npx vitest run --reporter verbose -t "git:checkout multi-strategy"
```

**Step 5: Commit**

```bash
git add packages/server/src/socket/chat-handler.ts packages/server/src/__tests__/chat-handler.test.ts
git commit -m "feat(server): multi-strategy git checkout fallback (G5)"
```

---

### Task 2: G12 — Effort Parameter UI

**Files:**
- Modify: `packages/shared/src/socket-events.ts` (add `chat:set_effort` event)
- Modify: `packages/shared/src/schemas/chat.ts` (add `chatSetEffortSchema`)
- Modify: `packages/shared/src/index.ts` (export new schema/type)
- Modify: `packages/summoner/src/types.ts` (add `setEffort` to ControllableSession)
- Modify: `packages/summoner/src/session.ts` (implement `setEffort`)
- Modify: `packages/server/src/socket/chat-handler.ts` (handle `chat:set_effort`)
- Modify: `packages/server/src/__tests__/chat-handler.test.ts`
- Modify: `packages/client/src/stores/chat-store.ts` (add `effort` state)
- Modify: `packages/client/src/hooks/use-chat.ts` (add `setEffort` action)
- Modify: `packages/client/src/components/HeaderBar.tsx` (add effort dropdown)
- Modify: `packages/client/src/components/__tests__/HeaderBar.test.tsx`

**Step 1: Write shared schema + types**

In `schemas/chat.ts`:
```typescript
export const chatSetEffortSchema = z.object({
  sessionId: z.string(),
  effort: z.enum(['low', 'medium', 'high']),
});
export type ChatSetEffortPayload = z.infer<typeof chatSetEffortSchema>;
```

In `socket-events.ts`, add to `ClientToServerEvents`:
```typescript
'chat:set_effort': (payload: ChatSetEffortPayload, cb: (res: { success: boolean; error?: string }) => void) => void;
```

In `types.ts` add `setEffort(effort: string): Promise<ControlResponse>` to ControllableSession.

**Step 2: Write summoner test**

In `packages/summoner/src/__tests__/session.test.ts`:
```typescript
it('should send set_effort control request', async () => {
  // Use FakeClaude to mock control_response
  // Call session.setEffort('low')
  // Assert stdin received control_request with subtype 'set_effort', effort: 'low'
});
```

**Step 3: Implement session.setEffort**

In `session.ts`:
```typescript
async setEffort(effort: string): Promise<ControlResponse> {
  return this.sendControlRequest('set_effort', { effort });
}
```

**Step 4: Write server handler test**

In `chat-handler.test.ts`:
```typescript
describe('chat:set_effort', () => {
  it('should forward effort to session', async () => {
    // emit chat:set_effort { sessionId, effort: 'low' }
    // assert session.setEffort called with 'low'
  });
});
```

**Step 5: Implement server handler**

In `chat-handler.ts`, add handler similar to `chat:set_model`.

**Step 6: Write store test**

In `packages/client/src/stores/__tests__/chat-store.test.ts`:
```typescript
it('should set effort', () => {
  store.getState().setEffort('low');
  expect(store.getState().effort).toBe('low');
});
```

**Step 7: Add store field + action**

In `chat-store.ts`: add `effort: 'low' | 'medium' | 'high'` default `'high'`, and `setEffort` action.

**Step 8: Write HeaderBar test**

In `HeaderBar.test.tsx`:
```typescript
it('should render effort selector and call onSetEffort', async () => {
  render(<HeaderBar effort="high" onSetEffort={mockFn} ... />);
  // click effort dropdown, select 'low'
  // assert mockFn('low')
});
```

**Step 9: Add effort dropdown to HeaderBar**

Follow thinking level pattern — dropdown with Low/Medium/High options.

**Step 10: Wire in use-chat.ts**

Add `setEffort` socket emit, wire to store.

**Step 11: Run all tests**

```bash
cd packages/summoner && npx vitest run
cd packages/server && npx vitest run
cd packages/client && npx vitest run
```

**Step 12: Commit**

```bash
git commit -m "feat: effort parameter UI control (G12)"
```

---

### Task 3: G8 — Session State Bidirectional Sync

**Files:**
- Modify: `packages/shared/src/socket-events.ts` (add `session:update_state` client→server)
- Modify: `packages/shared/src/schemas/chat.ts` (add schema)
- Modify: `packages/server/src/socket/chat-handler.ts` (handle + broadcast)
- Modify: `packages/server/src/__tests__/chat-handler.test.ts`
- Modify: `packages/client/src/hooks/use-chat.ts` (emit + listen)

**Context:** `session:state_changed` broadcasts server→client. Missing: client→server `session:update_state` for tab title/state changes propagated to other panels.

**Step 1: Write schema**

```typescript
export const sessionUpdateStateSchema = z.object({
  sessionId: z.string(),
  title: z.string().optional(),
  state: z.enum(['busy', 'idle']).optional(),
});
```

**Step 2: Write server test**

```typescript
describe('session:update_state', () => {
  it('should broadcast state change to all sockets', async () => {
    // emit session:update_state { sessionId, title: 'New Title' }
    // assert io.emit('session:state_changed', ...) was called
  });
});
```

**Step 3: Implement handler + broadcast**

**Step 4: Write client test in use-chat**

```typescript
it('should emit session:update_state when updating tab title', () => {
  // call updateSessionState(sessionId, { title: 'New' })
  // assert socket.emit('session:update_state', ...) called
});
```

**Step 5: Wire in use-chat**

**Step 6: Run tests, commit**

```bash
git commit -m "feat: bidirectional session state sync (G8)"
```

---

## Wave 2 — Medium, No Dependencies (parallel)

### Task 4: G6 — Init Options Hooks UI

**Files:**
- Modify: `packages/client/src/components/InitOptionsDialog.tsx` (add hooks config section)
- Modify: `packages/client/src/components/__tests__/InitOptionsDialog.test.tsx`
- Modify: `packages/client/src/stores/chat-store.ts` (add `initHooks` state)

**Context:** `InitializeOptions.hooks` supports hook registration (captureBaseline, saveFileIfNeeded, findDiagnosticsProblems). InitOptionsDialog exists but doesn't expose hooks config.

**Step 1: Write test**

```typescript
describe('InitOptionsDialog hooks config', () => {
  it('should render hooks toggle checkboxes', () => {
    render(<InitOptionsDialog ... />);
    expect(screen.getByLabelText('captureBaseline')).toBeInTheDocument();
    expect(screen.getByLabelText('saveFileIfNeeded')).toBeInTheDocument();
    expect(screen.getByLabelText('findDiagnosticsProblems')).toBeInTheDocument();
  });

  it('should include enabled hooks in onSave callback', async () => {
    const onSave = vi.fn();
    render(<InitOptionsDialog onSave={onSave} ... />);
    await userEvent.click(screen.getByLabelText('captureBaseline'));
    await userEvent.click(screen.getByText('Save'));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      hooks: expect.objectContaining({ PreToolUse: expect.any(Array) }),
    }));
  });
});
```

**Step 2: Implement UI — checkboxes in InitOptionsDialog for 3 hooks**

**Step 3: Store test + implementation for `initHooks`**

**Step 4: Run tests, commit**

```bash
git commit -m "feat(client): hooks configuration in InitOptionsDialog (G6)"
```

---

### Task 5: G9 — General Content Preview Panel

**Files:**
- Create: `packages/client/src/components/ContentPreviewPanel.tsx`
- Create: `packages/client/src/components/__tests__/ContentPreviewPanel.test.tsx`
- Modify: `packages/client/src/components/ChatPanel.tsx` (integrate panel)
- Modify: `packages/client/src/stores/chat-store.ts` (add `contentPreview` state)

**Context:** Protocol 05 defines `open_content` message for arbitrary markdown preview. PlanReviewBanner handles plans but no general-purpose content preview exists.

**Step 1: Write test**

```typescript
describe('ContentPreviewPanel', () => {
  it('should render markdown content', () => {
    render(<ContentPreviewPanel content="# Hello\n\nWorld" onClose={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Hello' })).toBeInTheDocument();
    expect(screen.getByText('World')).toBeInTheDocument();
  });

  it('should render plain text when not markdown', () => {
    render(<ContentPreviewPanel content="just text" onClose={vi.fn()} />);
    expect(screen.getByText('just text')).toBeInTheDocument();
  });

  it('should call onClose when close button clicked', async () => {
    const onClose = vi.fn();
    render(<ContentPreviewPanel content="test" onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
```

**Step 2: Implement component using MarkdownContent**

**Step 3: Add store state + wire in ChatPanel**

**Step 4: Run tests, commit**

```bash
git commit -m "feat(client): general content preview panel (G9)"
```

---

### Task 6: G1 — Session Teleportation

**Files:**
- Modify: `packages/shared/src/socket-events.ts` (add `session:teleport` event)
- Modify: `packages/shared/src/schemas/chat.ts` (add `sessionTeleportSchema`)
- Modify: `packages/server/src/socket/chat-handler.ts` (handle teleport)
- Modify: `packages/server/src/__tests__/chat-handler.test.ts`
- Modify: `packages/client/src/hooks/use-chat.ts` (add `teleportSession`)
- Modify: `packages/client/src/components/SessionHistory.tsx` (add teleport button)
- Modify: `packages/client/src/components/__tests__/SessionHistory.test.tsx`

**Context:** Protocol 07i: Fetch remote session via API, transform messages, import locally. Currently `session:list_remote` exists but no teleport action.

**Step 1: Write schema**

```typescript
export const sessionTeleportSchema = z.object({
  remoteSessionId: z.string(),
  branch: z.string().optional(),
});
export type SessionTeleportPayload = z.infer<typeof sessionTeleportSchema>;
```

Add to `ClientToServerEvents`:
```typescript
'session:teleport': (
  payload: SessionTeleportPayload,
  cb: (res: { success: boolean; sessionId?: string; error?: string }) => void,
) => void;
```

**Step 2: Write server test**

```typescript
describe('session:teleport', () => {
  it('should create session with resume from remote session ID', async () => {
    // emit session:teleport { remoteSessionId: 'remote-123' }
    // assert sessionManager.spawn called with resumeSessionId: 'remote-123'
    // assert callback { success: true, sessionId: ... }
  });

  it('should attempt git checkout if branch provided', async () => {
    // emit session:teleport { remoteSessionId: 'remote-123', branch: 'feature/x' }
    // assert git checkout attempted
  });

  it('should return error on failure', async () => {
    // mock spawn to throw
    // assert callback { success: false, error: ... }
  });
});
```

**Step 3: Implement handler**

Resume remote session via `sessionManager.spawn()` with `resumeSessionId`. Optionally checkout branch.

**Step 4: Write client test**

```typescript
it('should render teleport button for remote sessions', () => {
  render(<SessionHistory remoteSessions={[{ id: 'r1', title: 'Remote' }]} ... />);
  expect(screen.getByRole('button', { name: /teleport/i })).toBeInTheDocument();
});

it('should call onTeleport when clicked', async () => {
  const onTeleport = vi.fn();
  render(<SessionHistory remoteSessions={[...]} onTeleport={onTeleport} ... />);
  await userEvent.click(screen.getByRole('button', { name: /teleport/i }));
  expect(onTeleport).toHaveBeenCalledWith('r1');
});
```

**Step 5: Implement UI + hook wiring**

**Step 6: Run tests, commit**

```bash
git commit -m "feat: session teleportation from remote (G1)"
```

---

## Wave 3 — Medium, Some Dependencies

### Task 7: G2 — Enhanced Session Forking

**Files:**
- Modify: `packages/server/src/socket/chat-handler.ts` (enhance fork handler)
- Modify: `packages/server/src/__tests__/chat-handler.test.ts`
- Modify: `packages/client/src/components/MessageActions.tsx` (fork button enhancement)
- Modify: `packages/client/src/components/__tests__/MessageActions.test.tsx`

**Context:** Current fork delegates to CLI via `resumeSessionAt`. Protocol 07p specifies UUID remapping in session store and file history copy. Enhancement: add parent session reference tracking.

**Step 1: Write test — fork records parent relationship**

```typescript
describe('chat:fork enhanced', () => {
  it('should store parentId on forked session', async () => {
    // Create session, then fork
    // assert sessionStore.update called with { parentId: originalSessionId }
  });

  it('should include parent info in fork response', async () => {
    // emit chat:fork { sessionId, messageId }
    // assert callback includes { parentSessionId }
  });
});
```

**Step 2: Implement — add parentId to session store on fork**

**Step 3: Write client test — fork button shows parent info**

**Step 4: Run tests, commit**

```bash
git commit -m "feat: enhanced session forking with parent tracking (G2)"
```

---

### Task 8: G3 — File History Snapshot Awareness

**Files:**
- Modify: `packages/shared/src/socket-events.ts` (add `file_updated` handling in event types)
- Modify: `packages/client/src/stores/chat-store.ts` (track file snapshots per message)
- Modify: `packages/client/src/hooks/use-chat.ts` (handle `file_updated` events)
- Modify: `packages/client/src/components/ModifiedFilesPanel.tsx` (show snapshot timeline)
- Modify: `packages/client/src/components/__tests__/ModifiedFilesPanel.test.tsx`

**Context:** Protocol 07l: CLI tracks file history snapshots per message. `file_updated` events carry `oldContent`/`newContent`. Currently ModifiedFilesPanel tracks files but not per-message history timeline.

**Step 1: Write store test**

```typescript
describe('file history snapshots', () => {
  it('should track file versions per messageId', () => {
    store.getState().addFileSnapshot('msg-1', {
      filePath: '/src/foo.ts',
      oldContent: 'old',
      newContent: 'new',
    });
    expect(store.getState().fileSnapshots).toHaveLength(1);
    expect(store.getState().fileSnapshots[0].messageId).toBe('msg-1');
  });

  it('should return snapshots for a file path', () => {
    store.getState().addFileSnapshot('msg-1', { filePath: '/src/foo.ts', oldContent: 'v1', newContent: 'v2' });
    store.getState().addFileSnapshot('msg-2', { filePath: '/src/foo.ts', oldContent: 'v2', newContent: 'v3' });
    const snapshots = store.getState().getFileHistory('/src/foo.ts');
    expect(snapshots).toHaveLength(2);
  });
});
```

**Step 2: Implement store fields + actions**

**Step 3: Write use-chat test for `file_updated` event handling**

**Step 4: Wire `file_updated` event → store**

**Step 5: Write ModifiedFilesPanel test — show snapshot count per file**

```typescript
it('should show version count badge for files with multiple snapshots', () => {
  // render with fileSnapshots containing 3 versions of same file
  expect(screen.getByText('3 versions')).toBeInTheDocument();
});
```

**Step 6: Implement UI — version badge + expandable timeline**

**Step 7: Run tests, commit**

```bash
git commit -m "feat(client): file history snapshot tracking per message (G3)"
```

---

### Task 9: G14 — Session JSONL Export/Import

**Files:**
- Modify: `packages/shared/src/socket-events.ts` (add `session:export`, `session:import`)
- Modify: `packages/shared/src/schemas/chat.ts` (schemas)
- Modify: `packages/server/src/socket/chat-handler.ts` (handlers)
- Modify: `packages/server/src/__tests__/chat-handler.test.ts`
- Modify: `packages/client/src/hooks/use-chat.ts` (wire)
- Modify: `packages/client/src/components/SessionHistory.tsx` (export/import buttons)
- Modify: `packages/client/src/components/__tests__/SessionHistory.test.tsx`

**Context:** Protocol 07i/07p imply JSONL as the session format. Export allows sharing sessions; import allows resuming from file.

**Step 1: Write schemas**

```typescript
export const sessionExportSchema = z.object({ sessionId: z.string() });
export const sessionImportSchema = z.object({ jsonl: z.string() });
```

**Step 2: Write server test — export**

```typescript
describe('session:export', () => {
  it('should return raw events as JSONL string', async () => {
    // setup rawEventStore with events for session
    // emit session:export { sessionId }
    // assert callback { success: true, jsonl: string containing newline-delimited JSON }
  });
});
```

**Step 3: Implement export handler** — read from rawEventStore, serialize as JSONL.

**Step 4: Write server test — import**

```typescript
describe('session:import', () => {
  it('should create session from JSONL and return new sessionId', async () => {
    // emit session:import { jsonl: '...' }
    // assert sessionStore.create called
    // assert rawEventStore entries created
    // assert callback { success: true, sessionId }
  });
});
```

**Step 5: Implement import handler** — parse JSONL, create session record, store events.

**Step 6: Write client tests — export/import buttons in SessionHistory**

```typescript
it('should render export button for each session', () => {
  render(<SessionHistory sessions={[{ id: 's1', title: 'Test' }]} onExport={vi.fn()} ... />);
  expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
});

it('should render import button', () => {
  render(<SessionHistory onImport={vi.fn()} ... />);
  expect(screen.getByRole('button', { name: /import/i })).toBeInTheDocument();
});
```

**Step 7: Implement UI — export triggers download, import opens file picker**

**Step 8: Run tests, commit**

```bash
git commit -m "feat: session JSONL export/import (G14)"
```

---

## Wave 4 — Large Scope

### Task 10: G7 — Settings Management UI

**Files:**
- Create: `packages/client/src/components/SettingsPanel.tsx`
- Create: `packages/client/src/components/__tests__/SettingsPanel.test.tsx`
- Modify: `packages/shared/src/socket-events.ts` (add `settings:get`, `settings:update`)
- Modify: `packages/shared/src/schemas/chat.ts` (schemas)
- Modify: `packages/server/src/socket/chat-handler.ts` (handlers)
- Modify: `packages/server/src/__tests__/chat-handler.test.ts`
- Modify: `packages/client/src/hooks/use-chat.ts` (wire)
- Modify: `packages/client/src/components/ChatPanel.tsx` (integrate)

**Context:** Protocol 03-config describes `.claude/settings.json` with 60+ config items. No settings editor exists.

**Step 1: Write schema**

```typescript
export const settingsGetSchema = z.object({
  scope: z.enum(['project', 'user']),
});
export const settingsUpdateSchema = z.object({
  scope: z.enum(['project', 'user']),
  settings: z.record(z.unknown()),
});
```

**Step 2: Write server test — settings:get**

```typescript
describe('settings:get', () => {
  it('should read and return settings file', async () => {
    // mock fs.readFile for .claude/settings.json
    // assert callback { success: true, settings: { ... } }
  });

  it('should return empty object if file not found', async () => {
    // assert callback { success: true, settings: {} }
  });
});
```

**Step 3: Implement handler** — read `.claude/settings.json` or `~/.claude/settings.json` based on scope.

**Step 4: Write server test — settings:update**

```typescript
describe('settings:update', () => {
  it('should write merged settings to file', async () => {
    // emit settings:update { scope: 'project', settings: { key: 'value' } }
    // assert fs.writeFile called with merged JSON
  });
});
```

**Step 5: Implement update handler**

**Step 6: Write SettingsPanel test**

```typescript
describe('SettingsPanel', () => {
  it('should render settings as editable fields', () => {
    render(<SettingsPanel settings={{ model: 'sonnet' }} onUpdate={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByDisplayValue('sonnet')).toBeInTheDocument();
  });

  it('should call onUpdate with changed settings', async () => {
    const onUpdate = vi.fn();
    render(<SettingsPanel settings={{ model: 'sonnet' }} onUpdate={onUpdate} onClose={vi.fn()} />);
    // change model field
    await userEvent.click(screen.getByText('Save'));
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ model: expect.any(String) }));
  });

  it('should show project and user scope tabs', () => {
    render(<SettingsPanel ... />);
    expect(screen.getByRole('tab', { name: /project/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /user/i })).toBeInTheDocument();
  });
});
```

**Step 7: Implement SettingsPanel** — JSON editor with scope tabs, key-value display.

**Step 8: Wire in ChatPanel + use-chat**

**Step 9: Run tests, commit**

```bash
git commit -m "feat: settings management UI with project/user scope (G7)"
```

---

### Task 11: G15 — Log Event / Telemetry Dashboard

**Files:**
- Create: `packages/server/src/services/telemetry-store.ts`
- Create: `packages/server/src/__tests__/telemetry-store.test.ts`
- Create: `packages/client/src/components/TelemetryPanel.tsx`
- Create: `packages/client/src/components/__tests__/TelemetryPanel.test.tsx`
- Modify: `packages/shared/src/socket-events.ts` (add `telemetry:get`)
- Modify: `packages/server/src/socket/chat-handler.ts` (collect log_events, handle telemetry:get)
- Modify: `packages/server/src/__tests__/chat-handler.test.ts`
- Modify: `packages/client/src/hooks/use-chat.ts`
- Modify: `packages/client/src/components/ChatPanel.tsx`

**Context:** `log_event` MCP notifications are received but not stored/displayed. A dashboard showing tool usage frequency and event patterns would aid debugging.

**Step 1: Write telemetry store test**

```typescript
describe('TelemetryStore', () => {
  it('should record events', () => {
    const store = new InMemoryTelemetryStore();
    store.record({ eventName: 'tool_use', sessionId: 's1', timestamp: Date.now(), data: { tool: 'Read' } });
    expect(store.getAll()).toHaveLength(1);
  });

  it('should aggregate by event name', () => {
    const store = new InMemoryTelemetryStore();
    store.record({ eventName: 'tool_use', sessionId: 's1', timestamp: Date.now(), data: { tool: 'Read' } });
    store.record({ eventName: 'tool_use', sessionId: 's1', timestamp: Date.now(), data: { tool: 'Write' } });
    store.record({ eventName: 'error', sessionId: 's1', timestamp: Date.now(), data: {} });
    const summary = store.getSummary();
    expect(summary.tool_use).toBe(2);
    expect(summary.error).toBe(1);
  });
});
```

**Step 2: Implement InMemoryTelemetryStore**

**Step 3: Write server handler test — telemetry:get**

```typescript
describe('telemetry:get', () => {
  it('should return telemetry summary', async () => {
    // assert callback { summary: { tool_use: N, error: M } }
  });
});
```

**Step 4: Implement handler + wire log_event collection**

**Step 5: Write TelemetryPanel test**

```typescript
describe('TelemetryPanel', () => {
  it('should render event summary', () => {
    render(<TelemetryPanel summary={{ tool_use: 10, error: 2 }} onClose={vi.fn()} />);
    expect(screen.getByText('tool_use')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });
});
```

**Step 6: Implement TelemetryPanel** — table of event counts.

**Step 7: Wire in ChatPanel + use-chat**

**Step 8: Run tests, commit**

```bash
git commit -m "feat: log event telemetry dashboard (G15)"
```

---

## Execution Order

```
Wave 1 (parallel): Task 1 (G5), Task 2 (G12), Task 3 (G8)
Wave 2 (parallel): Task 4 (G6), Task 5 (G9), Task 6 (G1)
Wave 3 (parallel): Task 7 (G2), Task 8 (G3), Task 9 (G14)
Wave 4 (parallel): Task 10 (G7), Task 11 (G15)
```

## Verification

```bash
cd packages/summoner && npx vitest run
cd packages/server && npx vitest run
cd packages/client && npx vitest run
```
