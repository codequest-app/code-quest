## Why

Several interactive UI patterns are hand-rolled (collapsible blocks, model picker listbox, mention dropdown, checkboxes) duplicating accessibility logic that Radix UI already provides correctly. Migrating to Radix primitives removes custom keyboard navigation, focus management, and ARIA wiring.

## What Changes

- Replace `CollapsibleBlock` (primitives.tsx) `useState` open toggle with `@radix-ui/react-collapsible`
- Replace hand-rolled `role="listbox"` + active-index state in `ModelPickerPopover` with a Radix-based accessible pattern
- Replace hand-rolled ArrowUp/Down keyboard navigation in `MentionDropdown` with a Radix-based combobox pattern
- Replace custom checkbox markup in `FilterPopover` and `TaskChecklist` with `@radix-ui/react-checkbox`
- Install missing Radix packages: `@radix-ui/react-collapsible`, `@radix-ui/react-checkbox`

## Capabilities

### New Capabilities

- `collapsible-block`: Tool-use block expand/collapse using Radix Collapsible primitive
- `radix-checkbox`: Accessible checkbox component wrapping Radix Checkbox, used in FilterPopover and TaskChecklist
- `model-picker-listbox`: Accessible model picker using Radix Popover + keyboard-navigable list
- `mention-dropdown`: Accessible mention/file suggestion dropdown using Radix Popover + accessible list

### Modified Capabilities

- `filter-popover`: Checkbox implementation changes from hand-rolled to Radix Checkbox
- `shared-ui-primitives`: CollapsibleBlock implementation changes

## Impact

- `packages/client/src/components/chat/tool-use/message-blocks/primitives.tsx` — CollapsibleBlock refactor
- `packages/client/src/components/chat/tool-use/message-blocks/ToolUseBlock.tsx`, `ToolResultBlock.tsx`, `SystemBlocks.tsx`, `HookBlocks.tsx` — consume CollapsibleBlock
- `packages/client/src/components/chat/renderers/TruncatedContent.tsx` — uses CollapsibleBlock pattern
- `packages/client/src/components/settings/ModelPickerPopover.tsx` — listbox refactor
- `packages/client/src/components/chat/compose/MentionDropdown.tsx` — dropdown refactor
- `packages/client/src/components/live-session/FilterPopover.tsx` — checkboxes
- `packages/client/src/components/spec/TaskChecklist.tsx` — checkboxes
- New deps: `@radix-ui/react-collapsible`, `@radix-ui/react-checkbox`
