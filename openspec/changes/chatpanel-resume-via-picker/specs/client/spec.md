# Spec delta: client (chatpanel-resume-via-picker)

## ADDED Requirements

### Requirement: ChatPanel exposes a "Resume conversation" entry that opens the shared ResumePicker dialog

Inside an active channel's chat surface, users SHALL be able to
trigger a resume picker (with no cwd filter) from the command menu.
The picker SHALL list all resumable sessions across projects, and
selecting one routes the resumed channel to the correct project's
TabProvider via the `pendingActivateChannel` intent introduced in
`project-menu-resume`.

#### Scenario: User opens chat command menu and resumes a session from another project

- **GIVEN** the active project is `/proj-A` with one open tab,
  and a historical session exists for `/proj-B`
- **WHEN** the user invokes the command menu, types "Resume", picks
  the entry, and clicks the `/proj-B` session row in the dialog
- **THEN** the server's `session:resume` reuse-or-spawn path returns
  a `channelId`
- **AND** `setActiveProject('/proj-B')` is dispatched
- **AND** `requestActivateChannel('/proj-B', channelId)` is dispatched
- **AND** the dialog closes
- **AND** `/proj-B`'s `TabProvider` activates the tab once it appears
  via the `sessions` prop diff (per Decision 10 in Step 2)

### Requirement: ResumePicker onResume callback receives the picked session row

`ResumePickerProps.onResume` SHALL be invoked with two arguments:
the resolved `channelId` (string) and the picked `SessionSummary`
row. This lets caller dialogs that don't pre-filter the picker (chat
surface) route the resumed channel using `session.cwd`.

#### Scenario: Chat-surface dialog uses session.cwd to route

- **GIVEN** `ResumeSessionsDialog` is mounted without a `cwd` prop
- **WHEN** `ResumePicker` calls `onResume(channelId, session)` with
  `session.cwd === '/proj-B'`
- **THEN** the dialog dispatches
  `setActiveProject('/proj-B')` + `requestActivateChannel('/proj-B', channelId)`

### Requirement: ResumeSessionsDialog cwd prop is optional

`ResumeSessionsDialogProps.cwd` SHALL be optional. When set, the
embedded `ResumePicker` filters to that project (project sidebar
surface). When omitted, the picker lists all sessions (chat surface).
The dialog's `handleResume` SHALL derive the routing cwd via
`session.cwd ?? props.cwd`.

#### Scenario: Project surface passes cwd; chat surface omits it

- **GIVEN** a project sidebar mounts `<ResumeSessionsDialog cwd="/proj-A" />`
- **WHEN** the picker is rendered
- **THEN** it filters its `listSessions` request to `cwd: '/proj-A'`
- **GIVEN** a chat surface mounts `<ResumeSessionsDialog />` with no cwd
- **WHEN** the picker is rendered
- **THEN** it requests the unfiltered list (no `cwd` field)

## REMOVED Requirements

### Requirement: session:launch payload accepts resumeChannelId for legacy resume-via-launch flow

**Reason:** Step 1 deleted the only client emitter; Step 3 introduced
the dedicated `session:resume` event covering all resume flows.
`session:launch` is back to handling fresh launches only.

**Migration:** No external migration needed (no remote clients consume
this wire field). Internal references removed:
`sessionLaunchPayloadSchema.resumeChannelId`,
`handleLaunch`'s resume branch, the `buildLaunchOpts` resume param,
and four legacy tests.
