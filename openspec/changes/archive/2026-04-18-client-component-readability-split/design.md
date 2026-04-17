## Context

Five small readability fixes surfaced during the post-consolidation
review of `packages/client/src`. None are bugs; each reduces the
cognitive cost of reading the surrounding component.

## Decisions

### Grouping all five into one change

Alternative: five separate changes. Rejected — each item is <30 lines
of diff; separate changes would generate artifact ceremony out of
proportion to the work. They share a theme (local readability,
no behavior change) and can be reviewed together.

### Move resume-route to utils/ rather than keeping test colocated

`resume-route.ts` has no React dependency — it's a pure function on
`{ isEmpty, currentCwd, currentChannelId, picked, spawnedChannelId }`
returning a routing decision. It lives in `components/` only because
its single caller (`ChatPanel`) is there. The test doesn't render JSX.
Moving to `utils/` matches the existing convention (pure functions in
`utils/`, React components in `components/`). Keeping the test
colocated with source.

### ComposeInput split strategy

The current `handleKeyDown` nests: `if (slashOpen) { ... } else if
(mentionOpen) { ... } else if (history...) { ... } else { submit }`.
Split into four sub-handlers that each accept the React event and
return `boolean | void` — `true` = handled (early return), `void` =
continue. Top-level handler is a dispatch:

```ts
const handleKeyDown = (e) => {
  if (slashOpen && handleSlashKeyDown(e)) return;
  if (mentionOpen && handleMentionKeyDown(e)) return;
  if (handleHistoryKeyDown(e)) return;
  handleSubmit(e);
};
```

Each sub-handler is 10–25 lines, single-purpose, independently
testable.

### tool-registry dispatch table vs switch

Current: 15-case `switch` in `getToolHeaderInfo`. Refactor to a
`Record<string, (input: unknown) => ToolHeaderInfo>` lookup with each
tool's header extraction as a named function. Default fallback stays
for unknown tools.

The registry lookup is a standard swap; the name `tool-registry`
literally advertises this shape.

### InitOptionsDialog handleSave split

`handleSave` today runs: trim & validate hooks → construct init
options object → call `setInitOptions(...)` → call `onClose()`. The
validate+construct mix makes the flow hard to scan. Extract:
- `validateHookSelection(selected)` — returns `{ valid: boolean, error?: string }`
- `buildInitOptions(state)` — pure constructor

`handleSave` becomes: validate → early-return on invalid → build →
dispatch.

### ModelPickerPanel default-option extraction

The inline `(() => { ... })()` at line 80–108 renders the
"Default model" menu row conditionally. It's a self-contained ~30-line
block that tests the default flag, looks up the current provider
config, and renders JSX. Naming it `<DefaultModelOption>` makes the
outer JSX read linearly.

## Risks / Trade-offs

- **Test scope**: all tests must pass unchanged. A refactor that
  changes observable behavior would fail. Mitigation: keep the
  keyboard event handling order exactly the same in ComposeInput.
- **Bundle size**: none meaningful — same code, reorganized.
- **Diff size**: ~300 lines across 5 files. Reviewable in one pass.

## Migration

No runtime migration. One import path update in `ChatPanel.tsx` for
the `resume-route` move.
