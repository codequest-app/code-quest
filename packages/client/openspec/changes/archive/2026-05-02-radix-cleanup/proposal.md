## Why

After the core Radix migration (`migrate-ui-to-radix-primitives`), several cleanup issues remain:
duplicate resume logic between ChatPanel and SessionHistoryPopover, unnecessary exports,
implementation-detail test assertions, and existing tech debt in component responsibilities.

## What Changes

### Phase 1 — Radix migration cleanup (done)

- **SessionHistoryPopover**: consolidate duplicate resume logic from ChatPanel,
  remove redundant `open`/`onOpenChange` props, make `onResumed` required
- **ChatPanel**: replace ~40 lines of inline resume logic with SessionHistoryPopover
- **Visibility**: remove unnecessary exports (`BuildMenuItemsParams`, `HeaderBarProps`,
  `PermissionModePickerProps`)
- **Tests**: use `aria-selected` over `className`, semantic queries over DOM queries,
  `describe` blocks over section comments, remove CSS class assertion test

### Phase 2 — Existing tech debt (planned)

Components with mixed responsibilities identified during code review:

- **ComposeToolbar**: MCP server management + model selection + permission mode + effort level
- **CommandPalette**: message search + feature commands + tab navigation + keyboard interaction
- **RawEventPanel**: event subscription + filtering + search + virtualization + auto-scroll
- **QuestionContent**: tab selection + multi/single-select + validation + parent notification
- **WorkspaceLayout**: command palette + dialog management + project add + responsive layout

Approach: extract module-level functions (not custom hooks) when there is only one consumer.
Extract custom hooks only when 2+ consumers exist.

## Out of Scope

- Visual/layout changes
- New Radix primitive migrations (covered by `migrate-ui-to-radix-extras`)

## Risks

- Phase 2 components are large and well-tested — refactor must preserve all existing test assertions
