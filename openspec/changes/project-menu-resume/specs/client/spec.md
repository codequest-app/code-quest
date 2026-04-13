# Spec Delta: client (project-menu-resume)

## MODIFIED Requirements

### Requirement: SessionContext.listSessions accepts cwd and excludeLive

`useSession().listSessions` SHALL accept an options object with optional `cwd?: string`, `limit?: number`, `offset?: number`, `excludeLive?: boolean` fields and forward them in the `session:list` RPC payload.

#### Scenario: listSessions forwards excludeLive

- GIVEN a client with a mounted SessionProvider
- WHEN `listSessions({ cwd: '/proj', excludeLive: true })` is called
- THEN the socket SHALL emit `session:list { cwd: '/proj', excludeLive: true }`

## ADDED Requirements

### Requirement: ResumeProvider exposes useResume with a single resume action

The client SHALL mount a `ResumeProvider` inside the `SocketProvider` subtree. `useResume()` SHALL return `{ resume: (sessionId: string) => Promise<{ channelId: string }> }`. `resume()` SHALL emit `session:resume { sessionId }`, validate the callback via `sessionResumeResponseSchema`, resolve with `{ channelId }` on success, or reject with `Error(response.error)` on failure. A callback that fails schema validation SHALL reject with `Error('Invalid response')`.

#### Scenario: resume resolves with channelId

- GIVEN a mounted ResumeProvider with a fake socket
- WHEN `resume('sid-1')` is called and the socket callback fires with `{ channelId: 'ch-1' }`
- THEN the promise SHALL resolve with `{ channelId: 'ch-1' }`

#### Scenario: resume rejects with server error

- GIVEN the same setup
- WHEN the callback fires with `{ error: 'boom' }`
- THEN the promise SHALL reject with `Error('boom')`

#### Scenario: resume rejects on invalid response shape

- WHEN the callback fires with a payload failing `sessionResumeResponseSchema.safeParse`
- THEN the promise SHALL reject with `Error('Invalid response')`

#### Scenario: useResume outside Provider throws

- WHEN a component calls `useResume()` without a `ResumeProvider` ancestor
- THEN the hook SHALL throw a descriptive error

### Requirement: ResumePicker renders a cwd-scoped list of resumable sessions

`ResumePicker` SHALL accept `{ cwd?: string; onResume: (channelId: string) => void; onCancel: () => void }`. On mount it SHALL call `listSessions({ cwd, limit: 50, excludeLive: true })`. It SHALL render one row per returned session, invoke `useResume().resume(row.id)` on click, call `onResume(channelId)` on resolve, and render an inline error on reject without blocking other rows.

#### Scenario: empty list with cwd

- GIVEN `listSessions` resolves with `{ sessions: [], total: 0 }`
- AND `cwd = '/proj'`
- THEN the picker SHALL render `"No resumable sessions for this project."`
- AND a Close button that calls `onCancel`

#### Scenario: empty list without cwd

- GIVEN the same and `cwd` is undefined
- THEN the picker SHALL render `"No resumable sessions."`

#### Scenario: row click resumes

- GIVEN one row with id `sid-1`
- WHEN the user clicks the row
- THEN `useResume().resume('sid-1')` is called
- AND on resolve with `{ channelId: 'ch-1' }`, `onResume('ch-1')` is called

### Requirement: ProjectCard right-click opens a context menu with Resume session

`ProjectCard` SHALL handle `onContextMenu` by calling `event.preventDefault()` and rendering `ProjectContextMenu` at the pointer coordinates. The menu SHALL contain a single item labeled "Resume session…". Selecting it SHALL open a `ResumeSessionsDialog` scoped to `project.cwd`. The menu SHALL close on outside click and on Escape.

#### Scenario: right-click opens menu

- WHEN the user right-clicks a `ProjectCard`
- THEN the browser default menu SHALL be suppressed
- AND `ProjectContextMenu` SHALL render with a "Resume session…" item

#### Scenario: selecting Resume opens dialog

- WHEN the user clicks "Resume session…"
- THEN the menu SHALL close
- AND `ResumeSessionsDialog` SHALL open with `cwd === project.cwd`

#### Scenario: picker onResume switches project, requests activation, and closes dialog

- GIVEN the dialog is open for project `/proj`
- WHEN `ResumePicker.onResume('ch-1')` fires
- THEN `setActiveProject('/proj')` SHALL be called
- AND `requestActivateChannel('/proj', 'ch-1')` SHALL be called
- AND the dialog SHALL close
- AND the project's `TabProvider` SHALL surface the new channel via its `sessions` prop (driven by `session:states`)

### Requirement: ProjectContext exposes a pendingActivateChannel intent

`ProjectContext` SHALL expose `pendingActivateChannel: { cwd: string; channelId: string } | null` in its state (initial value `null`) and two actions: `requestActivateChannel(cwd: string, channelId: string): void` and `clearPendingActivate(): void`. See Decision 10 for rationale.

#### Scenario: requestActivateChannel sets the intent

- GIVEN a mounted `ProjectProvider` with `pendingActivateChannel === null`
- WHEN `requestActivateChannel('/proj', 'ch-1')` is called
- THEN `pendingActivateChannel` SHALL equal `{ cwd: '/proj', channelId: 'ch-1' }`

#### Scenario: clearPendingActivate clears the intent

- GIVEN `pendingActivateChannel === { cwd: '/proj', channelId: 'ch-1' }`
- WHEN `clearPendingActivate()` is called
- THEN `pendingActivateChannel` SHALL equal `null`

### Requirement: TabProvider activates the channel when a matching pendingActivate arrives

`TabProvider` SHALL observe `pendingActivateChannel` from `useProjectState()`. When `pendingActivateChannel.cwd` equals the provider's own `cwd` AND `pendingActivateChannel.channelId` is present in `tabs`, the provider SHALL call `setActiveTab(channelId)` and then `clearPendingActivate()`. The provider SHALL NOT clear the intent when it did not act. See Decision 10.

#### Scenario: cwd matches and channel exists in tabs

- GIVEN a `TabProvider` for cwd `/proj` with `tabs` containing `ch-1`
- WHEN `pendingActivateChannel === { cwd: '/proj', channelId: 'ch-1' }`
- THEN `setActiveTab('ch-1')` SHALL be called
- AND `clearPendingActivate()` SHALL be called

#### Scenario: cwd matches but channel not yet in tabs

- GIVEN a `TabProvider` for cwd `/proj` whose `tabs` does NOT yet contain `ch-1`
- WHEN `pendingActivateChannel === { cwd: '/proj', channelId: 'ch-1' }`
- THEN `setActiveTab` SHALL NOT be called
- AND `clearPendingActivate()` SHALL NOT be called (the provider waits for the `sessions`-driven auto-`addTab` effect)

#### Scenario: cwd does not match

- GIVEN a `TabProvider` for cwd `/other`
- WHEN `pendingActivateChannel === { cwd: '/proj', channelId: 'ch-1' }`
- THEN the provider SHALL ignore the intent (no `setActiveTab`, no clear)

### Requirement: ResumeSessionsDialog requests activation after server callback

On a successful resume, `ResumeSessionsDialog` SHALL call `setActiveProject(project.cwd)`, then `requestActivateChannel(project.cwd, channelId)`, and then close. See Decision 10.

#### Scenario: handleResume triggers the activation intent

- GIVEN the dialog is open for project `/proj`
- WHEN `ResumePicker.onResume('ch-1')` fires
- THEN `setActiveProject('/proj')`, `requestActivateChannel('/proj', 'ch-1')`, and dialog close SHALL occur in that order
