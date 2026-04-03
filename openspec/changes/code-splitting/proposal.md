## Why

Client bundle is 1,494 KB (gzip 495 KB) in a single chunk with zero code splitting. Conditionally rendered heavy components (CommandMenu, ManageMcpDialog, DiffViewer, AccountUsageDialog, PluginsPanel, AuthDialog) are included in the initial load even though users may never open them.

## What Changes

- Add `React.lazy()` + `Suspense` for conditionally rendered dialog/panel components
- Split initial load from on-demand chunks
- Target: reduce initial chunk by ~200-300 KB

## Capabilities

### New Capabilities

- `lazy-loading`: Conditionally rendered components are lazy-loaded via React.lazy + Suspense

### Modified Capabilities

## Impact

- `packages/client/src/components/ComposeToolbar.tsx` — lazy load dialogs (ManageMcpDialog, AccountUsageDialog, PluginsPanel, AuthDialog, ModelPickerPanel)
- `packages/client/src/components/ChatMessage.tsx` or MessageContent — lazy load DiffViewer
- `packages/client/src/components/WorkspaceLayout.tsx` or ChatPanel — lazy load CommandMenu
- No API/server changes
- No breaking changes to component APIs
