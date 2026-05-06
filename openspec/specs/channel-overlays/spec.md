# channel-overlays Specification

## Purpose
TBD - created by archiving change dissolve-chat-session. Update Purpose after archive.
## Requirements
### Requirement: ChannelOverlays 自給自足渲染 channel 事件 dialogs

`ChannelOverlays` 組件 SHALL 在 `ChannelProvider` context 內透過 hooks 自行讀取狀態，不接受任何 props，並渲染所有 channel 事件相關的 overlay UI。

#### Scenario: pending diff review 時顯示 ContentPreviewDialog
- **WHEN** `useChannelControl().pendingDiffReview` 不為 null
- **THEN** `ContentPreviewDialog` SHALL 顯示，並在 accept/reject 後呼叫 `diffRespond` 並清除狀態

#### Scenario: pending elicitation 時顯示 ElicitationDialog
- **WHEN** `useChannelControl().pendingElicitation` 不為 null
- **THEN** `ElicitationDialog` SHALL 顯示，submit 呼叫 `respondToElicitation`，cancel 呼叫 `cancelElicitation`

#### Scenario: btw side question 開啟時顯示 SideQuestionDialog
- **WHEN** `useBtwState().open` 為 true
- **THEN** `SideQuestionDialog` SHALL 顯示，關閉時呼叫 `btwSignal.setState({ open: false })`

#### Scenario: 無 pending 事件時不渲染任何 dialog
- **WHEN** 所有 channel 事件狀態皆為 null / false
- **THEN** `ChannelOverlays` SHALL 不渲染任何可見 UI

