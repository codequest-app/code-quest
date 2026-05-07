## ADDED Requirements

### Requirement: Layout axis reserved in preferences

`usePreferencesStore` SHALL 暴露 `layout: 'a' | 'b'` 欄位（預設 `'a'`），供未來多版面切換使用。本 change 不實作 B 版面，`App.tsx` 仍固定掛載現行 `WorkspaceLayout`。

#### Scenario: Default layout unchanged

- **WHEN** 使用者未更動 `layout` 欄位
- **THEN** 畫面渲染結果與變更前完全一致（現行 `WorkspaceLayout`）

#### Scenario: Layout value persists

- **WHEN** 呼叫 `setLayout('b')`
- **THEN** store 值更新並寫入 localStorage
- **AND** 畫面暫時仍渲染 `WorkspaceLayout`（B 版面留待後續 change 實作）
