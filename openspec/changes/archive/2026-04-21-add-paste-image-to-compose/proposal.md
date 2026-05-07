## Why

Users in chat-style workflows (Slack, Discord, Claude web UI, ChatGPT) expect to paste screenshots and images directly into the input box via Cmd/Ctrl+V. Currently the cc-office compose area only accepts images through the explicit attach-file picker, which forces users to save the image to disk first — breaking the common flow of "screenshot → paste → describe". Adding clipboard-image paste closes this UX gap with a ~10-line native implementation.

Package research confirmed no suitable npm dependency: `react-gluejar` (the only paste-focused library) has been unmaintained since ~2018 with no React 19 support; copy-oriented hooks (`react-use-clipboard`, `useCopyToClipboard`, etc.) solve the wrong direction. Web.dev, KendoReact, and current community guides all recommend the native `ClipboardEvent.clipboardData.items` API for this pattern.

## What Changes

- Add an `onPaste` handler to the `<textarea>` in `ComposeInput.tsx`
- When the clipboard contains one or more `image/*` items, extract them via `getAsFile()` and forward to the existing `compose.addAttachments(files)` from `ChannelComposeContext`
- Call `preventDefault()` on the paste event only if at least one image was captured — otherwise let normal text paste proceed unchanged
- Add play-function tests in `ComposeInput.stories.tsx` / unit tests that simulate a paste event with an image blob

## Capabilities

### New Capabilities
- `compose-paste-image`: Clipboard-paste image attachments for the chat compose textarea

### Modified Capabilities
<!-- none -->

## Impact

- **Affected code**: `apps/web/src/components/ComposeInput.tsx` (add onPaste handler), associated tests
- **No new dependencies**: native Web Platform API
- **No production behavioral change for non-image paste**: text paste unchanged
- **Risk**: low — additive handler, falls through to default on non-image clipboard contents
