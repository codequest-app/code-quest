## MODIFIED Requirements

### Requirement: Tab creation uses channelId as tab key
TabContext SHALL use channelId as the tab key for all tab creation paths. createNewTab SHALL generate channelId via `crypto.randomUUID()` and use it as the tab key. The `setChannelId` action SHALL be removed.

#### Scenario: User clicks New Tab
- **WHEN** user clicks "New tab"
- **THEN** createNewTab generates a channelId via crypto.randomUUID()
- **THEN** tab is created with channelId as key and cwd set
- **THEN** ChannelProvider receives channelId and cwd props

#### Scenario: External session created via broadcast
- **WHEN** session:created broadcast arrives with { channelId, cwd }
- **THEN** addTab is called with channelId as key, without cwd in TabMeta
- **THEN** if channelId already exists in tabs, state is unchanged (idempotent)

#### Scenario: Reload via syncFromServer
- **WHEN** app:init returns sessions list
- **THEN** each session is added via addTab with channelId as key, without cwd
- **THEN** tabs not in server list are removed
- **THEN** matching uses single key lookup (channelId === tab key)

### Requirement: TabMeta does not store channelId field
TabMeta SHALL NOT have a `channelId` property. The tab key itself IS the channelId. TabMeta SHALL only contain: title, tabStatus, and cwd (optional, only for launch).

#### Scenario: TabMeta structure
- **WHEN** a tab is created via any path
- **THEN** TabMeta contains only { title?, tabStatus, cwd? }
- **THEN** channelId is derived from the tab's key in the tabs record

### Requirement: ChannelProvider uses cwd to determine launch vs join
ChannelProvider SHALL always receive a channelId prop. When cwd prop is provided, it SHALL emit session:launch with both channelId and cwd. When cwd is undefined, it SHALL skip launch and proceed to join only.

#### Scenario: Launch mode (New Tab)
- **WHEN** ChannelProvider receives channelId and cwd props
- **THEN** it emits session:launch({ channelId, cwd })
- **THEN** it renders a loading indicator ("Connecting…") until launch completes
- **THEN** after launch callback returns, it renders the full child tree

#### Scenario: Join mode (existing session)
- **WHEN** ChannelProvider receives channelId but cwd is undefined
- **THEN** it skips session:launch
- **THEN** ChannelMessagesProvider performs session:join

#### Scenario: Unmount during launch
- **WHEN** ChannelProvider unmounts before launch callback returns
- **THEN** the launch callback is ignored (cancelled flag)
- **THEN** session cleanup is handled by WorkspaceLayout.handleCloseTab, not ChannelProvider

### Requirement: onChange callback does not include channelId
ChannelProvider onChange callback SHALL only carry `{ title?, status? }`. The channelId field SHALL be removed since the caller already knows channelId.

#### Scenario: Title update
- **WHEN** first user message is sent
- **THEN** onChange is called with { title: firstMessage.slice(0, 30) }

#### Scenario: Status update
- **WHEN** channel status changes
- **THEN** onChange is called with { status: 'default' | 'pending' | 'done' }
