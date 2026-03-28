# Gap Analysis Round 5 — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close remaining gaps between docs/ui + docs/protocol and the codebase — 7 items after filtering out 8 already-implemented features.

**Architecture:** Each task is a self-contained TDD cycle touching shared schemas → server handlers → client components. Changes follow existing patterns (Zod validation, Socket.IO typed events, Zustand store, @testing-library/react tests).

**Tech Stack:** TypeScript, Zod, Socket.IO, Vitest, React, Zustand, @testing-library/react

---

## Already Implemented (verified, skipped)

| ID | Feature | Finding |
|----|---------|---------|
| H3 | Speech-to-Text | ChatInput has mic button via useSpeechToText |
| H4 | Notification toast buttons | NotificationToast renders buttons array with onButton callback |
| H7 | File Rewind dry-run | MessageActions does dry_run=true first, shows RewindPreview, then confirms |
| H8 | Reactive suggestions | generateReactive() called on `result` event in chat-handler |
| H9 | Compact boundary indicator | StatsBar shows "Context compressed" badge when isContextCompressed=true |
| H10 | Session rename/delete | ChatPanel passes onRename={renameSession} onDelete={deleteSession} to SessionHistory |
| H11 | Tab icon states | TabBar renders pending (pulse dot) / done (checkmark) / default (grey dot) |
| H14 | Fast mode toggle | HeaderBar wired to setFastMode, gated by experiment gate |

---

## Wave 1 — No Dependencies (parallel)

### Task 1: H6 — Plan Comment → Approve Integration

**What:** When user approves a plan with accumulated comments, include them as `userFeedback` in the allow response.

**Files:**
- Modify: `packages/shared/src/schemas/chat.ts` — add optional `userFeedback` to allow branch
- Modify: `packages/client/src/components/PlanReviewBanner.tsx` — serialize planComments into `userFeedback` on approve
- Test: `packages/client/src/components/__tests__/PlanReviewBanner.test.tsx`

**Details:**
- `controlPermissionResponseSchema` allow branch (line ~61): add `userFeedback: z.string().optional()`
- `PlanReviewBanner` approve handler (line ~29): read `planComments` from store, serialize as `[On "selectedText"]: text\n...`, pass as `userFeedback` field in `{ behavior: 'allow', updatedInput, userFeedback }`
- Test: verify approve with comments includes userFeedback string; verify approve without comments has no userFeedback

---

### Task 2: H12 — Git Checkout in GitStatusPanel

**What:** Add branch checkout button to GitStatusPanel so users can switch branches from the UI.

**Files:**
- Modify: `packages/client/src/components/GitStatusPanel.tsx` — add `onCheckout` prop + branch input + checkout button
- Test: `packages/client/src/components/__tests__/GitStatusPanel.test.tsx`

**Details:**
- Add prop `onCheckout?: (branch: string) => Promise<GitCheckoutResult>`
- Add a text input + "Checkout" button in the header area
- On submit, call `onCheckout(branch)`, show success/error
- Wire in ChatPanel: `onCheckout={gitCheckout}`
- Tests: renders checkout input when onCheckout provided; calls onCheckout on submit; shows error on failure

---

### Task 3: H13 — Dynamic Available Models from CLI

**What:** When CLI sends `available_models` event, update the store so ModelSwitcher shows real models instead of hardcoded list.

**Files:**
- Modify: `packages/client/src/hooks/use-chat.ts` — handle `available_models` ChatStreamEvent
- Test: `packages/client/src/stores/__tests__/chat-store.test.ts`
- Test: `packages/client/src/components/__tests__/ModelSwitcherUnit.test.tsx`

**Details:**
- In use-chat `onEvent` handler, when `event.type === 'available_models'`, call `store().setAvailableModels(event.models)`
- `available_models` event shape from shared: `{ type: 'available_models', models: string[] }`
- Store test: verify `setAvailableModels` replaces the list
- ModelSwitcher test: verify it renders models from store (already does, just need test confirming dynamic update)

---

### Task 4: H15 — Session Count Badge

**What:** Show total session count in SessionHistory header.

**Files:**
- Modify: `packages/client/src/components/SessionHistory.tsx` — add count badge next to title
- Test: `packages/client/src/components/__tests__/SessionHistory.test.tsx`

**Details:**
- SessionHistory already receives `sessions` array prop
- In header (line ~121), change `"Session History"` to include `({sessions.length})` or a badge
- Also add `totalCount?: number` prop (from server's `total` field) for showing "5 of 42" when paginated
- Tests: renders session count; renders total when provided

---

## Wave 2 — No Dependencies (parallel)

### Task 5: H5 — MCP OAuth Callback URL Flow

**What:** After `mcp:authenticate` returns an auth URL, allow user to paste back the callback URL to complete OAuth.

**Files:**
- Modify: `packages/shared/src/socket-events.ts` — add `mcp:oauth_callback` to ClientToServerEvents
- Modify: `packages/shared/src/schemas/chat.ts` — add `mcpOAuthCallbackSchema`
- Modify: `packages/shared/src/index.ts` — export new schema
- Modify: `packages/server/src/socket/chat-handler.ts` — add `mcp:oauth_callback` handler
- Modify: `packages/client/src/components/MCPPanel.tsx` — add callback URL input after auth
- Modify: `packages/client/src/hooks/use-chat.ts` — add `mcpOAuthCallback` method
- Test: `packages/server/src/__tests__/chat-handler.test.ts`
- Test: `packages/client/src/components/__tests__/MCPPanel.test.tsx`

**Details:**
- Schema: `mcpOAuthCallbackSchema = z.object({ serverName: z.string(), callbackUrl: z.string().url() })`
- Server handler: validate, call `session.mcpMessage(serverName, { method: 'oauth_callback', params: { callbackUrl } })` (or a dedicated control_request if summoner supports it). For now, use `mcpMessage` as proxy.
- MCPPanel: after `mcp:authenticate` returns `{ authUrl }`, show input for paste-back URL + submit button
- Client: `mcpOAuthCallback(serverName, callbackUrl)` emits `mcp:oauth_callback`
- Tests: server handler validates and calls session method; MCPPanel renders callback input and calls submit

---

### Task 6: H2 — Auth Status/Login Implementation

**What:** Replace auth stubs with real implementations that store auth state and return profile info.

**Files:**
- Modify: `packages/server/src/socket/chat-handler.ts` — replace auth stubs with in-memory auth store
- Modify: `packages/client/src/components/LoginOverlay.tsx` — wire to real auth methods
- Test: `packages/server/src/__tests__/chat-handler.test.ts`

**Details:**
- Server: maintain `private authState: AuthStatus = { authenticated: false }` in ChatHandler
- `auth:status` → return `this.authState`
- `auth:login` → validate payload, set `authState = { authenticated: true, user: payload.apiKey ? 'api-key-user' : 'unknown', method: payload.apiKey ? 'api_key' : 'oauth' }`, return `{ success: true }`
- `auth:oauth_code` → validate code, set `authState` similarly, return `{ success: true }`
- Tests: login sets authenticated state; status reflects login state; oauth_code sets auth

---

### Task 7: H1 — Remote Control CLI Integration

**What:** Wire `remote_control:enable` to send the actual `remote_control` control_request to CLI.

**Files:**
- Modify: `packages/summoner/src/types.ts` — add `remoteControl(enabled: boolean): Promise<ControlResponse>` to ControllableSession
- Modify: `packages/summoner/src/session.ts` — implement `remoteControl` method
- Modify: `packages/server/src/socket/chat-handler.ts` — call `session.remoteControl(true/false)` in enable/disable handlers
- Test: `packages/server/src/__tests__/chat-handler.test.ts`

**Details:**
- Summoner: `async remoteControl(enabled: boolean) { return this.sendControlRequest('remote_control', { enabled }); }`
- Server enable handler: after room join, also call `session.remoteControl(true)`
- Server disable handler: after room leave, also call `session.remoteControl(false)`
- Tests: enable calls session.remoteControl(true); disable calls session.remoteControl(false)

---

## Execution Order

```
Wave 1 (parallel): H6, H12, H13, H15
Wave 2 (parallel): H5, H2, H1
```

## Verification

```bash
cd packages/server && npx vitest run
cd packages/client && node_modules/.bin/vitest run
cd packages/summoner && npx vitest run
```
