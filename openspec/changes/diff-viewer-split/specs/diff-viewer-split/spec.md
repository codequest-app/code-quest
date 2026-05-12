## ADDED Requirements

### Requirement: DiffViewer 支援 split 和 unified 兩種模式

DiffViewer SHALL 支援 split（左右兩欄）和 unified（單欄）兩種顯示模式，並提供切換按鈕。

#### Scenario: 預設以 split 模式顯示

- **WHEN** DiffViewer 渲染一個 unified diff string
- **THEN** 畫面以左右兩欄顯示，左欄為移除行（紅），右欄為新增行（綠）

#### Scenario: 切換到 unified 模式

- **WHEN** 使用者點擊切換按鈕
- **THEN** 畫面改為單欄 unified 格式，移除行（紅）和新增行（綠）依序排列

#### Scenario: 再次切換回 split 模式

- **WHEN** 使用者在 unified 模式下點擊切換按鈕
- **THEN** 畫面回到 split 兩欄顯示

### Requirement: DiffViewer 對外 API 不變

DiffViewer SHALL 保持 `content`、`editable`、`onAccept`、`onReject` props 不變，不影響現有呼叫端。

#### Scenario: editable 模式下有 Accept/Reject 按鈕

- **WHEN** `editable` 為 true
- **THEN** 顯示 Accept 和 Reject 按鈕，點擊分別觸發 `onAccept` 和 `onReject`
