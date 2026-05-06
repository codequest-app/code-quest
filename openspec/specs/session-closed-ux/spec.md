# session-closed-ux Specification

## Purpose
TBD - created by archiving change session-closed-ux. Update Purpose after archive.
## Requirements
### Requirement: session:closed 顯示 error banner
當 `session:closed` 事件觸發時，`onSessionClosed` SHALL 插入一條 `type: 'error'` 訊息，使其以 danger `AlertBanner` 樣式（紅色邊框）渲染。

#### Scenario: session 結束時顯示 error banner
- **WHEN** server 發送 `session:closed` 事件
- **THEN** channelMessages 中插入一條 `type: 'error'`、內容為 "CLI session has ended." 的訊息

#### Scenario: error banner 不以 plain text 渲染
- **WHEN** server 發送 `session:closed` 事件
- **THEN** 插入的訊息 `type` 不為 `'text'`

