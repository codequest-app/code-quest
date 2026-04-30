## 1. Setup

- [x] 1.1 Install `@radix-ui/react-collapsible` in packages/client
- [x] 1.2 Install `@radix-ui/react-checkbox` in packages/client

## 2. CollapsibleBlock → Radix Collapsible

- [x] 2.1 Write tests for CollapsibleBlock: default closed, default open, toggle, controlled open prop
- [x] 2.2 Refactor `CollapsibleBlock` in `primitives.tsx` to use `Collapsible.Root / Trigger / Content`
- [x] 2.3 Verify ToolUseBlock, ToolResultBlock, SystemBlocks, HookBlocks compile and render correctly
- [x] 2.4 Verify TruncatedContent (if it uses CollapsibleBlock) renders correctly

## 3. Shared ui/Checkbox Primitive

- [x] 3.1 Write tests for `ui/Checkbox`: renders checked, unchecked, fires onCheckedChange, renders label
- [x] 3.2 Create `packages/client/src/components/ui/Checkbox.tsx` wrapping `@radix-ui/react-checkbox`

## 4. FilterPopover — migrate to ui/Checkbox

- [x] 4.1 Replace hand-rolled checkbox markup in `FilterPopover.tsx` with `ui/Checkbox`
- [x] 4.2 Verify FilterPopover tests still pass

## 5. TaskChecklist — migrate to ui/Checkbox

- [x] 5.1 Replace hand-rolled `<input type="checkbox">` in `TaskChecklist.tsx` with `ui/Checkbox`
- [x] 5.2 Verify TaskChecklist renders and toggles correctly

## 6. ModelPickerPopover — DOM-focus listbox

- [x] 6.1 Write tests for keyboard navigation: ArrowDown, ArrowUp, Enter
- [x] 6.2 Remove `activeIndex` state; add `tabIndex={-1}` + `role="option"` to option elements
- [x] 6.3 Replace `activeIndex`-based highlight with CSS `:focus` / `data-highlighted` styling

## 7. MentionDropdown — combobox ARIA

- [x] 7.1 Write tests for combobox ARIA: textarea has role="combobox", aria-expanded, aria-activedescendant; options have id
- [x] 7.2 Add aria-haspopup, aria-controls, aria-expanded, aria-autocomplete to textarea in ComposeInput
- [x] 7.3 Add id to each FileResultItem option and aria-activedescendant to listbox section
