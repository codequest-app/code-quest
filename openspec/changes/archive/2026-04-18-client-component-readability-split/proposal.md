## Why

A recent client-wide code review flagged several components with
oversized functions, deep nesting, or misplaced modules. Each is small
on its own but hurts readability when new contributors scan these
files. This change collects the actionable ones into a single
refactor pass.

Non-goals (deliberately excluded): pre-existing type debt in
`message.ts` (`as Extract`/`as Message`), `socket-router.ts`
`as never` (documented socket.io limitation), predicates in `diff.ts`
that intentionally swallow non-diff inputs. Those require their own
scoped audits.

## What Changes

1. **`ComposeInput.handleKeyDown`** (80+ lines, 4-level nesting) —
   split into per-menu sub-handlers: `handleSlashKeyDown`,
   `handleMentionKeyDown`, `handleHistoryKeyDown`, `handleSubmit`. The
   top-level handler dispatches by active menu.
2. **`tool-registry.getToolHeaderInfo`** (15+ case switch, 40 lines) —
   split per tool-type helper (`bashHeader`, `readHeader`, etc.) with
   a registry lookup, keeping a default fallback.
3. **`InitOptionsDialog.handleSave`** (multi-responsibility: validate +
   transform + build + dispatch) — extract `buildInitOptions()` and
   `validateHookSelection()` so `handleSave` reads as a three-line
   orchestrator.
4. **`ModelPickerPanel` IIFE in JSX** — extract the inline
   `(() => { ... })()` default-option block to a named
   `<DefaultModelOption>` subcomponent.
5. **`resume-route.ts` location** — `components/resume-route.ts` is a
   pure function (no JSX, no React hooks) tested by
   `components/__tests__/resume-route.test.ts`. Move both to `utils/`
   (source + test) and update the lone import in `ChatPanel.tsx`.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
(none — internal refactors only, no requirement changes)

## Impact

- `apps/web/src/components/ComposeInput.tsx`
- `apps/web/src/components/tools/tool-registry.ts`
- `apps/web/src/components/InitOptionsDialog.tsx`
- `apps/web/src/components/ModelPickerPanel.tsx`
- `apps/web/src/components/resume-route.ts` → moved to
  `apps/web/src/utils/resume-route.ts`
- `apps/web/src/components/__tests__/resume-route.test.ts` →
  moved to `apps/web/src/utils/__tests__/resume-route.test.ts`
- `apps/web/src/components/ChatPanel.tsx` — import path update
- No test changes beyond relocation; all 1147 client tests must still
  pass with no expect changes.
