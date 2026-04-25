# client-empty-state Specification

## Purpose
TBD - created by archiving change right-pane-visual-polish. Update Purpose after archive.
## Requirements
### Requirement: EmptyState SHALL accept icon and hint slots

`EmptyState` MUST accept an optional `icon` prop (rendered as a 32-40px
muted glyph above the message) and an optional `hint` slot (rendered
below the message, for code snippets / CTA / secondary text). The message
SHALL be constrained to a `max-w-xs` width so it does not span the full
pane.

#### Scenario: Caller provides icon + message + hint
- **WHEN** `<EmptyState icon={...} message="..." hint={...} />` is rendered
- **THEN** the icon appears centered above the message, the message is centered with max-width constraint, and the hint appears centered below the message

#### Scenario: Caller provides only message
- **WHEN** `<EmptyState message="..." />` is rendered (no icon, no hint)
- **THEN** only the centered message renders; layout still flex-1 + centered

### Requirement: SpecPane no-openspec state SHALL include icon and shell hint

When `useOpenspecList(cwd)` returns `{ error: 'no-openspec' }`, SpecPane MUST render an EmptyState with the ClipboardDocumentListIcon, a friendly message, and the `openspec init` command in a monospace pill as the hint.

#### Scenario: Project has no openspec directory
- **WHEN** SpecPane mounts for a cwd that has no openspec/ directory
- **THEN** the pane shows a centered ClipboardDocumentListIcon, the message about openspec init, and a `<code>openspec init</code>` pill in the hint slot

### Requirement: PaneStatusFooter SHALL summarize pane content

Each pane SHALL render a `PaneStatusFooter` at the bottom showing a brief
summary of the loaded content (e.g., "main · 3 changes" for GitPane).
The footer MUST NOT render while initial data is still loading (avoids
flashing zero counts).

#### Scenario: Git status loaded with changes
- **WHEN** GitPane has `data` with branch='main' and 3 changed files
- **THEN** the footer renders text containing 'main' and '3'

#### Scenario: Initial git status still loading
- **WHEN** GitPane has `data === undefined`
- **THEN** no footer renders (the centered Spinner already conveys loading)

### Requirement: User-triggered async actions SHALL show inline pending state

Buttons that fire an RPC (Stage all, Commit, Fetch, Pull, Push, Discard, Archive change) MUST render an inline `<Spinner>` next to the button label and disable the button while the RPC is in flight. The pattern is standardized via `useAsyncAction(fn): { run, pending }`.

#### Scenario: User clicks Stage all and the RPC is in flight
- **WHEN** the user clicks Stage all and the request has not yet resolved
- **THEN** the button shows an inline spinner AND is disabled (cannot fire again)

#### Scenario: RPC resolves
- **WHEN** the Stage all RPC resolves (success or error)
- **THEN** the spinner disappears and the button is enabled again

