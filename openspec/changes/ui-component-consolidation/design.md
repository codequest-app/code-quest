## Context

`ui-primitive-extraction` 完成後，`components/ui/` 有 Badge、Button、IconButton 等通用 primitive。但掃描後發現：
- Chat 層有 6+ 個元件重複用 `bg-surface border border-border rounded-lg shadow-floating` 但沒有 primitive
- Input/textarea 跨 settings、spec、files 共 5+ 處樣式不一致（背景色三種寫法混用）
- ProjectList、ProjectTree、InstalledPluginList 各自 inline 定義相同的 group header

## Goals / Non-Goals

**Goals:**
- 建立 `components/chat/ui/` 目錄，放 chat domain 專屬 primitive
- 新增三個 primitive：FloatingCard（chat/ui）、TextField（ui）、GroupHeader（ui）
- 清理已有 primitive 未採用的地方（StatusDot、SectionLabel、GhostAddButton、Button）
- 補齊少數設計 token 缺口

**Non-Goals:**
- 改動任何元件的視覺或行為
- 重構 palette 的 tab trigger（語義特殊，保留）
- 處理 arbitrary calc 的 dialog 高度（需要設計確認，本次跳過）

## Decisions

**1. FloatingCard 放 `components/chat/ui/` 而非 `components/ui/`**

`shadow-floating` + `rounded-lg` 的 card pattern 全部出現在 chat 層（HookCallbackCard、PermissionModePicker、AttachMenu、MessageActionsMenu、PlanReviewBanner、ToolPermissionCard）。`components/ui/` 的 SurfaceCard 已處理無陰影版本，加 shadow variant 會讓 SurfaceCard 語義模糊。獨立放 `chat/ui/` 讓邊界清晰。

**2. TextField 統一背景用 `bg-surface`**

目前三種寫法：`bg-input`（AuthDialog）、`bg-input-bg`（InitOptionsDialog）、`bg-code-block`（McpServerRow）。`bg-surface` 是最語義正確的選擇，input 背景應與 surface 一致。焦點狀態統一用 `focus:border-accent focus:outline-none`。

**3. GroupHeader 不是 SectionLabel 的 variant**

SectionLabel 是 `font-semibold uppercase tracking-wider text-text-muted`（無 padding、可放任意 as）。GroupHeader 固定是 `section-label px-1 pt-2 pb-1`，帶 padding，用在 tree/list 的分組標題，語義不同，抽成獨立 component。

**4. 未採用 primitive 的清理方式**

逐一替換，不改視覺。InstalledPluginList 的 inline StatusDot 直接換成 import；ProjectList 的手刻按鈕換成 GhostAddButton；LiveSessionPopover/FilterPopover 的按鈕換成 `<Button size="xs">`。

## Risks / Trade-offs

- **TextField 背景色統一**：從 `bg-code-block` 改成 `bg-surface` 會有微小視覺差異。需確認 McpServerRow 的 mono input 視覺上可接受。
- **FloatingCard z-index/width 不統一**：各 consumer 的 `z-modal`、`z-popover`、`min-w-*` 不同，FloatingCard 不包這些，由 consumer 透過 className 覆蓋。
