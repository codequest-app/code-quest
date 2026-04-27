## Why

cc-office has several hand-rolled popover/dialog components with custom positioning, outside-click handling, focus management, and escape-key logic. These are fragile, inconsistent, and miss edge cases (scroll locking, focus trapping, portal rendering). Radix UI primitives handle all of this correctly and accessibly out of the box.

Migrating to Radix also lets us delete `usePopover` and other custom hooks once all consumers move over.

## What Changes

Replace 4 components' internal overlay/positioning logic with Radix primitives, **without changing visual appearance or public API**.

### ~~CommandMenu~~ (excluded)
- Dual-trigger (button click + typing `/`) + `absolute bottom-full left-0 right-0` full-width positioning relative to ChatInputArea
- Radix Popover's anchor-based positioning is fundamentally incompatible — the menu must span the compose area, not just the button
- Validated by spike: Radix popper wrapper injects `position: fixed` + transforms that break the absolute layout; overrides are too hacky
- Keep as-is; the manual outside-click handler works correctly

### 1. MentionDropdown → `@radix-ui/react-popover` (low risk)
- Pure render component; keyboard nav owned by ComposeInput
- Only needs Radix Popover for outside-click + positioning
- Anchor to ComposeInput, render item list inside Popover.Content

### 2. SessionDropdown → `@radix-ui/react-popover` (low risk)
- Already has `role="dialog"` overlay with manual outside-click
- Replace custom overlay + positioning with Radix Popover
- Keep session list rendering unchanged

### 3. ModelPickerPopover → `@radix-ui/react-popover` (low risk)
- Simple button-triggered popover with model list
- After migration, `usePopover` hook loses its last consumer → delete it

### 4. AccountUsageDialog → `@radix-ui/react-dialog` (low risk)
- Modal dialog with backdrop
- Replace custom backdrop + focus trap with Radix Dialog
- Keep all content/layout unchanged

## Out of Scope

- Collapsible components (TruncatedContent, ThinkingBlock) → separate change
- Tooltip migration → separate change
- Scroll area migration → separate change
- Any visual/layout changes — this is a pure internals swap

## Dependencies

- `@radix-ui/react-popover` (already installed for other uses)
- `@radix-ui/react-dialog` (already installed for other uses)

## Risks

- Focus management differences between custom and Radix could affect keyboard nav — test thoroughly
- SessionDropdown overlay has `role="none"` which can't have `aria-label` — may need `data-testid` for that element
