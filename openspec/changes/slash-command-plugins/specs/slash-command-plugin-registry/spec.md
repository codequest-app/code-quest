## ADDED Requirements

### Requirement: ChannelFeature and SlashCommandFeature interfaces
The system SHALL define a base `ChannelFeature` interface (`{ id: string }`) and a `SlashCommandFeature` interface that extends `ChannelFeature` with slash command capabilities:
- `ChannelFeature`: `{ id: string }` — base interface; all features implement this
- `SlashCommandFeature extends ChannelFeature`:
  - `command: string` — the slash command key (e.g. `'/usage'`), used as registry key and default match
  - `match?(message: string): boolean` — optional custom match; defaults to `message.trim() === command`
  - `invoke(message: string): void` — called from `sendMessage` intercept when match succeeds; SHALL NOT forward the message to CLI unless the feature explicitly does so
  - `execute?(): void` — called directly from slash menu or ⌘K menu click; bypasses `sendMessage`
- A feature may implement only `ChannelFeature` (no slash command); only `SlashCommandFeature` instances participate in sendMessage intercept and slash menu

#### Scenario: Feature with default match
- **WHEN** `sendMessage('/reload-plugins')` is called and no custom `match` is defined
- **THEN** the feature whose `command === '/reload-plugins'` is matched

#### Scenario: Feature with custom match (arguments)
- **WHEN** `sendMessage('/compact 50')` is called and the feature defines `match(msg) { return msg.trim().startsWith('/compact') }`
- **THEN** that feature is matched and `invoke('/compact 50')` is called

#### Scenario: No matching feature
- **WHEN** `sendMessage('hello')` is called and no feature matches
- **THEN** the message is forwarded to CLI via `chat:send` as normal

---

### Requirement: Feature registry intercepts sendMessage
The `sendMessage` wrapper in `ChannelMessagesContext` SHALL query the feature registry before forwarding to CLI.

#### Scenario: Matched feature short-circuits CLI
- **WHEN** `sendMessage` receives a message matching a registered feature
- **THEN** `feature.invoke(message)` is called and the function returns early — no `chat:send` is emitted

#### Scenario: Unmatched message reaches CLI
- **WHEN** `sendMessage` receives a message that matches no feature
- **THEN** `chat:send` is emitted to the server as before

---

### Requirement: Slash menu click routes through execute
When a slash menu item is selected, if the matching feature defines `execute`, it SHALL be called directly without going through `sendMessage`.

#### Scenario: Feature has execute
- **WHEN** user selects a slash command from the slash menu and the feature defines `execute`
- **THEN** `feature.execute()` is called and `sendMessage` is NOT called

#### Scenario: Feature has no execute
- **WHEN** user selects a slash command from the slash menu and the feature has no `execute`
- **THEN** `executeSlashCommand` falls through to `sendMessage(cmd)` → `invoke()` as normal

---

### Requirement: ⌘K menu callbacks call feature.execute
⌘K menu items for `/reload-plugins`, `/usage`, and `/rewind` SHALL call the corresponding feature's `execute()` instead of inline handlers.

#### Scenario: ⌘K Reload features
- **WHEN** user clicks "Reload features" in the ⌘K menu
- **THEN** `reloadPluginsFeature.execute()` is called

#### Scenario: ⌘K Account & usage
- **WHEN** user clicks "Account & usage…" in the ⌘K menu
- **THEN** `usageFeature.execute()` is called

#### Scenario: ⌘K Rewind
- **WHEN** user clicks "Rewind" in the ⌘K menu
- **THEN** `rewindFeature.execute()` is called

---

### Requirement: /reload-plugins feature
The `/reload-plugins` feature SHALL call `reloadPlugins()` RPC on both `invoke` and `execute`.

#### Scenario: Slash menu triggers reload
- **WHEN** user selects `/reload-plugins` from the slash menu
- **THEN** `reloadPlugins()` RPC is called and no `chat:send` is emitted

#### Scenario: ⌘K triggers reload
- **WHEN** user clicks "Reload features" in ⌘K menu
- **THEN** `reloadPlugins()` RPC is called

---

### Requirement: /usage feature
The `/usage` feature SHALL open the AccountUsageDialog and trigger `settings:refresh_usage` on `execute`. `invoke` SHALL delegate to `execute`.

#### Scenario: Slash menu triggers usage dialog
- **WHEN** user selects `/usage` from the slash menu
- **THEN** AccountUsageDialog opens and `settings:refresh_usage` is emitted — no `chat:send` is emitted

#### Scenario: ⌘K triggers usage dialog
- **WHEN** user clicks "Account & usage…" in ⌘K menu
- **THEN** AccountUsageDialog opens and `settings:refresh_usage` is emitted

#### Scenario: Feature manages its own open state
- **WHEN** AccountUsageDialog is closed
- **THEN** feature's `isOpen` becomes `false` and all subscribers are notified

---

### Requirement: /rewind feature
The `/rewind` feature SHALL open the RewindDialog on `execute`. It has no `invoke` (no slash menu entry).

#### Scenario: ⌘K triggers rewind dialog
- **WHEN** user clicks "Rewind" in ⌘K menu
- **THEN** RewindDialog opens — no `chat:send` is emitted

#### Scenario: Feature manages its own open state
- **WHEN** RewindDialog is closed
- **THEN** feature's `isOpen` becomes `false` and all subscribers are notified

---

### Requirement: /compact feature
The `/compact` feature's `invoke` SHALL forward the message to CLI via `chat:send`. It has no `execute` (no ⌘K entry).

#### Scenario: Slash menu triggers compact
- **WHEN** user selects `/compact` from the slash menu
- **THEN** `chat:send('/compact')` is emitted to the server

#### Scenario: /compact with arguments
- **WHEN** user types `/compact 50` and sends
- **THEN** `chat:send('/compact 50')` is emitted to the server

---

### Requirement: Slash menu commands sorted by name
Slash commands in the slash menu SHALL be displayed in ascending alphabetical order by `command`.

#### Scenario: Commands sorted alphabetically
- **WHEN** the slash menu is opened
- **THEN** commands are listed in ascending alphabetical order (e.g. `/compact` before `/reload-plugins` before `/usage`)

#### Scenario: New feature registration preserves sort order
- **WHEN** a new feature is registered
- **THEN** the slash menu re-renders with all commands in alphabetical order

---

### Requirement: Feature open state resets on dialog close
Features that manage dialog open state SHALL reset `isOpen` to `false` when the dialog is closed (unmount or explicit close action).

#### Scenario: Dialog unmounts
- **WHEN** a dialog component unmounts
- **THEN** the feature's `close()` is called and `isOpen` becomes `false`

#### Scenario: Stale state prevented on remount
- **WHEN** a dialog component mounts
- **THEN** it reads `isOpen` from the feature — if a prior session left it `true`, the dialog SHALL NOT re-open unexpectedly (feature `close()` on unmount prevents this)
