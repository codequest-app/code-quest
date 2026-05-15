## Context

`ui-primitive-extraction` 完成後，`components/ui/` 有完整的 Badge、Button、IconButton 等 primitive。但 chat 區的元件在這次 refactor 之前就已存在，尚未對齊。另外 `McpStatusBadge` 當初為了方便放在 `ui/`，但它匯入了 `McpServerInfo` 型別，違反 `ui/` 應為無業務語義的原則。

## Goals / Non-Goals

**Goals:**
- `McpStatusBadge` 搬到 `components/settings/`，讓 `ui/` 保持純通用
- Chat 元件改用現有 `Badge` / `Button`，消除 inline className 常數
- 新增 `--color-border-subtle` token，讓 `border-border/50` 有具名語義
- 修正非標準 opacity 語法 `bg-accent/[0.06]` → `bg-accent/10`

**Non-Goals:**
- 建立新的 `chat/ui/` 目錄（本次問題不需要新 component）
- 改動 chat 元件的行為或視覺
- 全域搜尋所有 `border-border/50`（只修 chat 區出現的）

## Decisions

**1. McpStatusBadge 放 `components/settings/` 而非 `components/ui/`**

它綁定 `McpServerInfo['status']` 型別，consumer 全在 settings 層（ManageMcpDialog、McpServerRow）。搬到 settings 讓 `ui/` 只剩純 primitive，import 路徑對 consumer 而言更直覺（同層）。

**2. `border-border-subtle` 加在 `@theme` 而非用 opacity modifier**

`border-border/50` 雖然可用，但在多個語義場景（thinking block 縮排線、permission picker 分隔線、node content badge 邊框）重複出現，代表它是一個有名字的設計決策，值得給 token。

**3. `ToolGroupSummary` chip → `Badge variant="muted"`**

Chip 的外觀（`bg-surface text-text-muted rounded px-1.5 py-0.5 font-medium`）與 `Badge` 的 `muted` variant 一致。error chip 對應 `Badge variant="danger"`。直接替換，不需要調整 Badge API。

**4. `ModifiedFilesPanel ACTION_BTN` → `Button size="xs"`**

Accept 按鈕 = `variant="primary" size="xs"`，Rewind 按鈕 = `variant="secondary" size="xs"`。Button 的 xs size 尺寸（`px-2 py-1 text-xs`）與原本 ACTION_BTN 一致，可直接替換。

**5. `menu-components MenuItemRow` 保留原樣**

它使用 `bg-selected text-selected-text` 作為 active state（command palette 特有語義），與 `MenuItem` 的 hover-based 互動模式不同，強行替換會改變行為，暫不處理。

## Risks / Trade-offs

- **McpStatusBadge 搬移會 break import**：需一次更新所有 consumer（ManageMcpDialog、McpServerRow）。因為都在 settings 層，影響有限且容易追蹤。
- **border-border-subtle token 新增**：不會 break 任何現有代碼，是純加法。
- **Badge size="xs" padding 可能略有差異**：原 `py-0.5` vs Badge xs 的 `py-px`，視覺上幾乎不可見，但需確認 ToolGroupSummary 的 chip 高度沒有跳動。
