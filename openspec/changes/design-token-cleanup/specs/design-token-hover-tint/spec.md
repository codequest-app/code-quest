## ADDED Requirements

### Requirement: Hover tint uses design token
全站 hover 半透明 tint（原 `bg-white/5`）SHALL 改用統一的 design token，不得直接 hardcode `white` 或 `black`。

#### Scenario: Surface hover uses token class
- **WHEN** 元件需要 hover 半透明背景效果
- **THEN** className 使用 `hover:bg-surface-hover` 或 `bg-surface-hover`，不使用 `bg-white/5`

### Requirement: Danger color uses token
錯誤/警告顏色 SHALL 使用 `text-danger` / `bg-danger` token，不使用 `text-red-500`、`text-red-400`、`bg-red-500`。

#### Scenario: Danger text uses token
- **WHEN** 元件顯示錯誤狀態文字
- **THEN** className 使用 `text-danger`，不使用任何 `red-*` utility

### Requirement: Shadow uses token
浮層 shadow SHALL 使用 `shadow-floating`，不使用 `shadow-lg` 或其他 arbitrary shadow。

#### Scenario: Popover/dialog shadow uses token
- **WHEN** 元件為 popover、dialog 或浮動面板
- **THEN** className 使用 `shadow-floating`

### Requirement: Z-index uses token
Z-index SHALL 使用 `z-raised`、`z-sticky`、`z-float`、`z-overlay`、`z-modal`、`z-popover`、`z-palette` token，不使用 `z-10`、`z-50` 等 arbitrary value。

#### Scenario: Modal z-index uses token
- **WHEN** 元件為 modal 層級
- **THEN** className 使用 `z-modal`，不使用 `z-50`

### Requirement: Overlay background uses token
全屏遮罩 SHALL 使用 `bg-overlay` 或 `bg-input-overlay` token，不使用 `bg-black/50`、`bg-black/70`。

#### Scenario: Modal overlay uses token
- **WHEN** 元件顯示全屏遮罩背景
- **THEN** className 使用 `bg-overlay`
