## ADDED Requirements

### Requirement: General section hosts preferences shortcuts

`CommandMenu` 的 `General` section SHALL 包含 `switch-color-theme`、`toggle-density`、`open-settings` 三個 menu items。若未來新增 `switch-font-size` 等偏好相關項目，亦歸於此 section。

#### Scenario: General section includes preference toggles

- **WHEN** 以 `buildMenuItems(...)` 回傳結果 inspect `General` section
- **THEN** 包含 id 為 `switch-color-theme`, `toggle-density`, `open-settings` 的 items
