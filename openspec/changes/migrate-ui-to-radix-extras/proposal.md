## Why

After the core Popover/Dialog migrations (`migrate-ui-to-radix-primitives`), three more categories of hand-rolled UI can be replaced with Radix primitives: collapsible sections, tooltips, and scroll areas. These are all low-risk, additive replacements that improve accessibility and reduce custom code.

## What Changes

### 1. TruncatedContent / ThinkingBlock → `@radix-ui/react-collapsible`
- Replace custom expand/collapse state + animation with Radix Collapsible
- `Collapsible.Root` wraps the section, `Collapsible.Trigger` is the toggle button, `Collapsible.Content` is the expandable body
- Preserves existing animation via Radix's `data-state="open|closed"` + CSS transitions

### 2. Tooltip → `@radix-ui/react-tooltip`
- Replace any custom tooltip implementations with Radix Tooltip
- Wrap app (or workspace) in `Tooltip.Provider` with appropriate `delayDuration`
- Each tooltip: `Tooltip.Root` > `Tooltip.Trigger` + `Tooltip.Content`
- Handles hover delay, focus, Escape dismiss, collision avoidance

### 3. Scroll Areas → `@radix-ui/react-scroll-area`
- Replace custom-styled overflow containers with Radix ScrollArea
- Consistent cross-browser scrollbar styling via `ScrollArea.Scrollbar` + `ScrollArea.Thumb`
- Candidates: session list, file list, message list sidebar panels

## Out of Scope

- Popover/Dialog migrations (covered by `migrate-ui-to-radix-primitives`)
- Any visual/layout changes — pure internals swap

## Dependencies

- `@radix-ui/react-collapsible`
- `@radix-ui/react-tooltip`
- `@radix-ui/react-scroll-area`

## Risks

- Collapsible animation timing may differ from current CSS — need visual check
- ScrollArea may affect virtualized lists if any exist — verify no conflicts
