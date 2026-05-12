## ADDED Requirements

### Requirement: Expandable 預設展開狀態由 caller 控制

`Expandable` SHALL 接受 `defaultOpen` prop，決定初始展開狀態。預設值為 `false`（收合）。

#### Scenario: defaultOpen=true 時預設展開

- **WHEN** `Expandable` 以 `defaultOpen={true}` render
- **THEN** 內容預設為展開狀態，不需使用者操作

#### Scenario: defaultOpen=false 時預設收合

- **WHEN** `Expandable` 以 `defaultOpen={false}` 或不傳 render
- **THEN** 內容預設為收合狀態

### Requirement: 最後一則訊息（live / isLastTurn）預設展開

系統 SHALL 對標記為 `isLastTurn` 的訊息，將其 text content 的 `Expandable` 設為 `defaultOpen={true}`；其他歷史訊息設為 `defaultOpen={false}`。

#### Scenario: live / isLastTurn 的 text 訊息預設展開

- **WHEN** `NodeContent` 收到 `isLastTurn={true}` 且 `message.type === 'text'`
- **THEN** 該訊息的 `Expandable` 預設展開

#### Scenario: history 的 text 訊息預設收合

- **WHEN** `NodeContent` 收到 `isLastTurn={false}` 且 `message.type === 'text'`
- **THEN** 該訊息的 `Expandable` 預設收合

#### Scenario: assistant_turn 的 text block 跟隨 isLastTurn

- **WHEN** `AssistantTurnContent` 的 `isLastTurn={true}`
- **THEN** 其內部 text block 的 `Expandable` 預設展開

### Requirement: streaming 中手動操作狀態保留

`Expandable` 的展開/收合狀態 SHALL 在 streaming delta 到來時保持不變（不因內容更新而 reset）。

#### Scenario: streaming 中手動展開後保持展開

- **WHEN** `Expandable` 預設收合，使用者手動點擊展開，之後 streaming delta 繼續到來
- **THEN** `Expandable` 維持展開狀態

#### Scenario: streaming 中手動收合後保持收合

- **WHEN** `Expandable` 預設展開，使用者手動點擊收合，之後 streaming delta 繼續到來
- **THEN** `Expandable` 維持收合狀態
