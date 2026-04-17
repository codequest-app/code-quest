## Why

Slash commands (`/usage`, `/rewind`, `/reload-plugins`, `/compact`) are currently handled inconsistently — some are hardcoded in ComposeToolbar UI state, some are intercepted ad-hoc in `sendMessage`. Centralizing them as self-contained features gives a uniform invocation path and makes it trivial to add new commands without touching shared context code.

## What Changes

- Introduce a `SlashCommandFeature` interface with three invocation patterns:
  - `match?(message: string): boolean` — custom match logic (default: exact string); for commands with arguments
  - `invoke(message: string): void` — called from `sendMessage` intercept
  - `execute?(): void` — called directly from slash menu click (bypasses sendMessage); for commands that open dialogs without sending a message
- Introduce a feature registry queried in `sendMessage` and slash menu select handler
- Migrate 4 commands to features:
  - `/reload-plugins` — slash menu + ⌘K "Reload plugins"; `invoke`/`execute` both call RPC
  - `/usage` — slash menu + ⌘K "Account & usage…"; `execute` opens dialog + triggers usage refresh; feature manages its own open state
  - `/rewind` — ⌘K "Rewind" only (no slash menu); `execute` opens dialog; feature manages its own open state
  - `/compact` — slash menu only (no ⌘K); `invoke` calls `chat:send('/compact')` to CLI
- ⌘K `callbacks` (`onReloadPlugins`, `onOpenAccountUsage`, `onRewind`) unified to call the same feature action as slash menu
- `ComposeToolbar` `activeDialog` state removed for `usage` and `rewind`; each feature manages its own open state

## Capabilities

### New Capabilities
- `slash-command-plugin-registry`: Feature registry and `sendMessage` intercept — uniform slash command dispatch

### Modified Capabilities

## Impact

- `packages/client/src/contexts/channel/ChannelMessagesContext.tsx` — sendMessage intercept
- `packages/client/src/components/ComposeToolbar.tsx` — remove `activeDialog` for usage/rewind
- `packages/client/src/components/AccountUsageDialog.tsx` — self-managed open state
- `packages/client/src/components/RewindDialog.tsx` — self-managed open state
- Tests: `ChatPanel.test.tsx`, `ComposeToolbar.test.tsx`, `AccountUsageDialog.test.tsx`
