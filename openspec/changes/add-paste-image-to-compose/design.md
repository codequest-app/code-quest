## Context

`ComposeInput.tsx` already wires a `<textarea>` to `ChannelComposeContext`, which exposes `addAttachments(files: File[])` consumed by the existing attach-file-picker flow. The compose toolbar renders an attachment chip strip whenever `attachedFiles.length > 0`. What's missing is a bridge from the native clipboard paste event to that same API — every other piece exists.

Package research (web.dev Clipboard patterns, KendoReact KB, tigerabrodi, apocalypse.dev, 2026 community consensus) uniformly points at native `ClipboardEvent` handling for image paste in a React textarea. The only paste-oriented React library, `react-gluejar`, is unmaintained (~2018 last release, no React 19 claims). Copy-direction hooks (`react-use-clipboard`, `useCopyToClipboard`) are not applicable.

## Goals / Non-Goals

**Goals:**
- Paste image → attachment with one keystroke, no mouse
- Native, zero-dependency implementation
- Preserve default text-paste behavior completely unchanged

**Non-Goals:**
- Screenshot capture APIs (`getDisplayMedia`, `Screenshot API`)
- Drag-and-drop attach — separate flow, different event model
- Image preview / resize / compression before upload
- Text+image mixed paste where both are preserved

## Decisions

### Decision: Native `onPaste` handler, no dependency
**Chosen**: React synthetic `onPaste` on `<textarea>` reading `e.clipboardData.items`.
**Alternative considered**: `react-gluejar` declarative component.
**Rationale**: `react-gluejar` is unmaintained and wraps children — incompatible with our controlled textarea. The native path is ~10 lines, uses built-in types, and is a well-documented Web Platform pattern (web.dev/patterns/clipboard).

### Decision: Iterate `items`, not `files`
**Chosen**: `for (const item of e.clipboardData.items) if (item.kind === 'file' && item.type.startsWith('image/'))`.
**Alternative considered**: `e.clipboardData.files`.
**Rationale**: `items` is the broader, more consistent shape across browsers and exposes `kind` discriminator directly. `files` can be empty in some cross-browser edge cases even when an image is present in `items`.

### Decision: preventDefault only when an image is captured
**Chosen**: accumulate captured files, call `preventDefault()` iff at least one file was captured, then forward to `addAttachments`.
**Alternative considered**: always preventDefault inside the handler.
**Rationale**: unconditional prevent would break plain text paste. The conditional keeps the change truly additive — if no image, browser default runs.

### Decision: Mixed image+text paste drops the text
**Chosen**: when an image is captured we `preventDefault()`, which also drops any accompanying clipboard text.
**Alternative considered**: paste the text manually after `preventDefault`.
**Rationale**: mixed clipboards are rare in the wild; the complexity of "insert text at cursor and append file" isn't worth the edge case. Spec Scenario 4 documents this explicitly so a future change can revisit.

### Decision: Test via Storybook play function
**Chosen**: extend `ComposeInput.stories.tsx` with a `PasteImage` story whose play function synthesises a paste event with a fake `File` and asserts the attachment chip appears.
**Alternative considered**: RTL-only unit test.
**Rationale**: consistent with project convention (storybook-component skill: "User interactions & UI behavior → Storybook play functions"). An RTL test can be added alongside if play-function assertions prove fragile with `DataTransfer` in jsdom.

## Risks / Trade-offs

- **Risk**: `DataTransfer` / `ClipboardEvent` constructor is not available in jsdom by default → **Mitigation**: use a minimal stub object shape (`{ items: [{ kind, type, getAsFile: () => fakeFile }] }`) passed via `fireEvent.paste(target, { clipboardData: stub })`. `storybook/test` / RTL both support this pattern.

- **Risk**: Browser differences on how `image/*` items surface (`items` vs `files`) → **Mitigation**: iterate `items` with the `kind === 'file'` guard, matching web.dev's canonical example; if issues surface, fall back to reading `files` as well.

- **Trade-off**: Mixed image+text paste drops the text portion. Documented in spec and design; can be revisited.

## Open Questions

- Do we want to restrict accepted image types (e.g. only png/jpeg)? The existing attach-file picker accepts any `image/*`; matching that keeps parity. Assume no restriction unless a user reports otherwise.
- Should the paste action emit a toast confirming attachment? Not in this release — keeps scope minimal; the chip appearing in the toolbar is sufficient feedback.
