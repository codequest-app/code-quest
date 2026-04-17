## 1. Relocate resume-route (pure function) from components/ to utils/

- [x] 1.1 Move `packages/client/src/components/resume-route.ts` →
  `packages/client/src/utils/resume-route.ts`
- [x] 1.2 Move
  `packages/client/src/components/__tests__/resume-route.test.ts` →
  `packages/client/src/utils/__tests__/resume-route.test.ts`
- [x] 1.3 Update test's relative import (`../resume-route`) as needed
- [x] 1.4 Update `ChatPanel.tsx` import path
- [x] 1.5 Tests pass (1147/1147)

## 2. Split ComposeInput.handleKeyDown

- [x] 2.1 Extract `handleSlashKeyDown(e) => boolean` (returns true =
  handled)
- [x] 2.2 Extract `handleMentionKeyDown(e) => boolean`
- [x] 2.3 Extract `handleHistoryKeyDown(e) => boolean`
- [x] 2.4 Extract `handleSubmit(e)` (terminal action, void)
- [x] 2.5 `handleKeyDown` becomes 4-line dispatch
- [x] 2.6 Tests pass; keyboard interaction order unchanged

## 3. Split tool-registry.getToolHeaderInfo

- [x] 3.1 Identify the 15+ `case` branches in the current switch
- [x] 3.2 Define per-tool header extractor functions (named, small)
- [x] 3.3 Build a `TOOL_HEADER_REGISTRY: Record<string, Extractor>`
  lookup
- [x] 3.4 `getToolHeaderInfo(toolName, input)` becomes a lookup +
  default-fallback call
- [x] 3.5 Tests pass

## 4. Split InitOptionsDialog.handleSave

- [x] 4.1 Extract `validateHookSelection(selected): { valid, error? }`
- [x] 4.2 Extract `buildInitOptions(state): InitOptions` pure
  constructor
- [x] 4.3 `handleSave` reads as: validate → early-return → build →
  dispatch → close
- [x] 4.4 Tests pass

## 5. Extract ModelPickerPanel IIFE → DefaultModelOption

- [x] 5.1 Identify the inline `(() => { ... })()` block at ~line 80–108
- [x] 5.2 Extract to a colocated `DefaultModelOption` component in the
  same file (not a new file — single-consumer)
- [x] 5.3 Outer JSX inlines the component instead of the IIFE
- [x] 5.4 Tests pass

## 6. Verification

- [x] 6.1 Full client test suite passes (1147/1147) with no test
  changes beyond the resume-route relocation
- [x] 6.2 Biome + tsc clean
- [x] 6.3 `git diff --stat` review — each task produces a focused diff

## 7. Non-goals (explicit, out of scope)

- [ ] 7.1 `message.ts` `as Extract` / `as Message` type casts —
  pre-existing type debt; separate audit
- [ ] 7.2 `socket-router.ts` `as never` — documented socket.io
  typed-event limitation
- [ ] 7.3 `diff.ts` empty catch — `isDiff`/`parseDiffFileName` are
  predicates; non-diff input returning `false`/`null` is by design
- [ ] 7.4 `useSpeechToText` `onerror` handler — reviewed; already
  calls `toast.error`, not an empty catch
- [ ] 7.5 `usage-feature.ts` `this.execute()` — all callers use method
  form, binding is correct
- [ ] 7.6 `RewindDialog` 195-line component — larger design decision,
  out of refactor-only scope
- [ ] 7.7 `AccountUsageDialog` nested ternaries — pre-existing, style
  preference
