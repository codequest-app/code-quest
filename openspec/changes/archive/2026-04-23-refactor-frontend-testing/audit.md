# Frontend Test Audit

172 檔逐一依 `design.md` D4 分類。每檔一列；Phase 2 按 `category` 欄批次重構。

## Categories（見 design.md D4）

- `keep-as-is` — 已符合六原則，無 duplicate
- `small-tweak` — 小問題（query priority、imports、命名）
- `fake-replace` — 用了 `vi.mock('./Component')` 或 module mock
- `consumer-merge` — shallow presentational test，已被 consumer 覆蓋
- `structural` — scope / 位置嚴重錯置
- `duplicate` — 同 behavior 在多處斷言

若一檔觸犯多條，取嚴重者為主 category，其他列 `notes`。

## Columns

- `file` — 相對 `apps/web/src` 路徑
- `category` — 主分類
- `dup-with` — 跨檔重複的對照檔（如適用）
- `notes` — 具體問題摘要

---

## src/components/__tests__/

**Summary**: 43 keep-as-is · 22 small-tweak · 3 consumer-merge · 0 structural · 0 fake-replace · 1 duplicate

| file | category | dup-with | notes |
|---|---|---|---|
| ActivityBar.test.tsx | keep-as-is | - | getByRole + renderWithWorkspace, clean |
| AddButton.test.tsx | small-tweak | - | `fireEvent.mouseDown`/`keyDown` → `userEvent` |
| AddProjectDialog.test.tsx | keep-as-is | - | FakeSummoner + SocketProvider |
| AuthDialog.test.tsx | keep-as-is | - | renderWithChannel |
| ChatInputArea.test.tsx | keep-as-is | - | renderWithWorkspace + FakeSpeechRecognition |
| ChatMessage.test.tsx | keep-as-is | - | comprehensive msg-type coverage |
| ChatPanel.test.tsx | keep-as-is | - | full pipeline + socket |
| CitationsPanel.test.tsx | keep-as-is | - | renderWithWorkspace + segments |
| CodeBlock.test.tsx | small-tweak | - | clipboard 手動 mock → `vi.spyOn` (L14-20) |
| CollapsibleTimeline.test.tsx | keep-as-is | - | pure component |
| CommandPalette.test.tsx | keep-as-is | - | renderWithChannel + socket helpers |
| CommandPaletteAllTab.test.tsx | keep-as-is | - | context-aware |
| ComposeInput.test.tsx | keep-as-is | - | paste event clean |
| ComposeToolbar.test.tsx | keep-as-is | - | MCP integration |
| ContentPreviewDialog.test.tsx | small-tweak | - | 3 個 test 過簡 |
| CreateWorktreeDialog.test.tsx | small-tweak | - | util test 與 component test 混 (L14-37) |
| CreateWorktreeFlow.test.tsx | keep-as-is | - | e2e + FakeGitService |
| DiffViewer.test.tsx | duplicate | utils/__tests__/diff.test.ts | isDiff + parseDiffFileName 兩個 describe 字面重複 util test，處理方式：刪除（Phase 2e 已做） |
| ElicitationDialog.test.tsx | small-tweak | - | 4 tests 過簡；缺 a11y assertion |
| EmptyState.test.tsx | keep-as-is | - | 無 actionLabel 變體條件渲染在 consumer 不覆蓋；reclassify from consumer-merge |
| ErrorFallback.test.tsx | keep-as-is | - | 刻意丟錯的 Boom 元件測 ErrorBoundary 整合，自成 SUT；reclassify from consumer-merge |
| FileTree.test.tsx | small-tweak | - | FakeSummoner 設置 OK |
| FilterPopover.test.tsx | keep-as-is | - | 完整 checkbox/filter |
| HeaderBar.test.tsx | keep-as-is | - | renderWithChannel |
| InitOptionsDialog.test.tsx | small-tweak | - | getByRole 對 textarea 可用 (L12) |
| JsonViewer.test.tsx | keep-as-is | - | pure component |
| MarkdownContent.test.tsx | keep-as-is | - | 涵蓋完整 |
| McpServerRow.test.tsx | keep-as-is | - | a11y + conditional |
| MentionDropdown.test.tsx | small-tweak | - | fireEvent → userEvent |
| MessageActions.test.tsx | keep-as-is | - | renderWithWorkspace |
| MessageList.test.tsx | keep-as-is | - | scroll + visibility context |
| ModifiedFilesPanel.test.tsx | keep-as-is | - | 10 expects 獨立 state 邏輯（expand/collapse/status/version/diff）；reclassify from consumer-merge |
| NotificationToast.test.tsx | keep-as-is | - | variant 測試乾淨 |
| OnboardingOverlay.test.tsx | small-tweak | - | store 整合；缺 aria assertion |
| PendingActionButtons.test.tsx | keep-as-is | - | control flow OK |
| PlanCommentPopover.test.tsx | small-tweak | - | 基礎覆蓋 |
| PlanReviewBanner.test.tsx | small-tweak | - | 無互動測試 |
| ProjectCard.test.tsx | keep-as-is | - | 完整右鍵 resume 流程 |
| ProjectContextMenu.test.tsx | small-tweak | - | fireEvent → userEvent |
| ProjectList.test.tsx | small-tweak | - | list + filtering 基礎 |
| RawEventPanel.test.tsx | small-tweak | - | 最小互動 |
| ReviewUpsellBanner.test.tsx | keep-as-is | - | banner/CTA 乾淨 |
| ScrollToBottom.test.tsx | keep-as-is | - | scroll + 可見性 |
| SearchBar.test.tsx | keep-as-is | - | input + button state |
| SessionDropdown.test.tsx | small-tweak | - | dropdown 互動最小 |
| SessionHistory.test.tsx | keep-as-is | - | search + 選取 |
| SessionRow.test.tsx | small-tweak | - | 基礎 |
| SettingsDialog.test.tsx | small-tweak | - | 基礎覆蓋 |
| SideQuestionDialog.test.tsx | small-tweak | - | 基礎變體 |
| SpeechInputContainer.test.tsx | small-tweak | - | assertion 可再強化 |
| SpinnerVerb.test.tsx | keep-as-is | - | animation state |
| TabBar.test.tsx | small-tweak | - | keyboard + click |
| TaskStarted.test.tsx | keep-as-is | - | 渲染 + icon |
| ThinkingBlock.test.tsx | small-tweak | - | 基礎 |
| ToolBlock.test.tsx | small-tweak | - | tool input/output |
| TruncatedContent.test.tsx | small-tweak | - | 最小 |
| WorkspaceLayout-worktree.test.tsx | keep-as-is | - | workspace + worktree |
| WorkspaceLayout.test.tsx | keep-as-is | - | 完整 layout + sidebar + tab |
| WorkspaceLayoutRWD.test.tsx | keep-as-is | - | RWD 測試 |
| WorktreeBanner.test.tsx | keep-as-is | - | banner 乾淨 |
| getSlashQuery.test.ts | keep-as-is | - | pure util |
| message-blocks.test.tsx | keep-as-is | - | renderBody helper + tool block |
| model-picker-panel.test.tsx | small-tweak | - | dropdown 選取 |
| slash-command/dismiss.test.tsx | keep-as-is | - | slash 行為 |
| slash-command/mention-file.test.tsx | keep-as-is | - | file mention |
| slash-command/mode-cycling.test.tsx | keep-as-is | - | mode 轉換 |
| slash-command/navigation.test.tsx | keep-as-is | - | arrow + 選取 |
| slash-command/sections.test.tsx | keep-as-is | - | section 分群 |
| slash-command/typing.test.tsx | keep-as-is | - | 打字 + palette filter |

## src/components/palette/__tests__/

| file | category | dup-with | notes |
|---|---|---|---|
| FeatureRow.test.tsx | keep-as-is | - | userEvent, 乾淨 |
| PaletteCommandList.test.tsx | keep-as-is | - | userEvent + render helper |
| PaletteMessageList.test.tsx | keep-as-is | - | setup/helpers 乾淨 |
| palette-message-results.test.ts | keep-as-is | - | pure util |
| to-palette-command.test.tsx | keep-as-is | - | mixed unit + render, clean |

## src/components/command-menu/__tests__/

| file | category | dup-with | notes |
|---|---|---|---|
| CommandMenu.test.tsx | keep-as-is | - | 317 行 UI 整合測試跟 build-menu-items (pure data) 不同層；reclassify from consumer-merge |
| build-menu-items.test.ts | keep-as-is | - | pure function |
| menu-layout.test.ts | keep-as-is | - | pure util |

## src/components/message-blocks/__tests__/

| file | category | dup-with | notes |
|---|---|---|---|
| AlertBanner.test.tsx | keep-as-is | - | presentational 簡潔 |
| ContentRenderer.test.tsx | fake-replace | - | L6-25 `vi.mock('../shared')` / `DiffViewer` / `../../../utils/diff` → Fake Component |

## src/components/ui/__tests__/

| file | category | dup-with | notes |
|---|---|---|---|
| Button.test.tsx | keep-as-is | - | userEvent |
| Dialog.test.tsx | keep-as-is | - | async 正確 |
| EffortSwitch.test.tsx | keep-as-is | - | DOM contract |
| PanelHeader.test.tsx | keep-as-is | - | simple presentational |
| SearchField.test.tsx | keep-as-is | - | ref forwarding |
| SectionHeader.test.tsx | keep-as-is | - | simple |
| TextField.test.tsx | keep-as-is | - | userEvent |

## src/contexts/**/__tests__/

**Summary**: 18 keep-as-is · 7 small-tweak · 0 fake-replace · 0 consumer-merge · 0 structural · 3 duplicate

| file | category | dup-with | notes |
|---|---|---|---|
| contexts/__tests__/ChannelComposeProvider.test.tsx | keep-as-is | - | renderWithChannel |
| contexts/__tests__/ChannelContext.test.tsx | keep-as-is | - | renderWithChannel + renderWithWorkspace |
| contexts/__tests__/ChannelProvider.test.tsx | keep-as-is | - | renderWithWorkspace |
| contexts/__tests__/ProjectContext.test.tsx | small-tweak | - | 手工 FakeSummoner wrapper → 用 helper |
| contexts/__tests__/SessionContext-auth.test.tsx | small-tweak | - | 手工 socket.emit 攔截（legacy） |
| contexts/__tests__/SessionContext-resume.test.tsx | small-tweak | - | inline mock socket → Fake Socket |
| contexts/__tests__/SessionContext.test.tsx | small-tweak | - | `vi.mock('sonner')` 外部 lib（可留） |
| contexts/__tests__/SocketContext.test.tsx | keep-as-is | - | renderHook + FakeSummoner |
| contexts/__tests__/TabContext/state.test.tsx | keep-as-is | - | renderHook + helper |
| contexts/__tests__/TabContext/sync.test.tsx | keep-as-is | - | renderWithSessions |
| contexts/__tests__/TabContext/ui.test.tsx | keep-as-is | - | renderWithWorkspace + renderInTab |
| contexts/__tests__/WorktreeContext.test.tsx | small-tweak | - | 手工 FakeSummoner + createFakeServer |
| contexts/channel/__tests__/ChannelIdContext.test.tsx | duplicate | ChannelProvider-id-context.test.tsx, channelId-in-state.test.tsx | 3 檔測同一 hook |
| contexts/channel/__tests__/ChannelProvider-id-context.test.tsx | duplicate | ChannelIdContext.test.tsx | 見上 |
| contexts/channel/__tests__/MessageVisibilityContext.test.tsx | keep-as-is | - | renderWithChannel |
| contexts/channel/__tests__/actions-no-emit.test.tsx | keep-as-is | - | renderWithChannel |
| contexts/channel/__tests__/channelId-in-state.test.tsx | duplicate | ChannelIdContext.test.tsx | 見上 |
| contexts/channel/__tests__/config-from-session/auto-mode.test.tsx | keep-as-is | - | renderWithWorkspace + prepareInit |
| contexts/channel/__tests__/config-from-session/core.test.tsx | keep-as-is | - | renderWithChannel/Workspace |
| contexts/channel/__tests__/config-from-session/model-switch.test.tsx | keep-as-is | - | renderWithWorkspace |
| contexts/channel/__tests__/config-from-session/plugin-reload.test.tsx | keep-as-is | - | renderWithChannel |
| contexts/channel/__tests__/permission-actions.test.ts | small-tweak | - | 手工 FakeSummoner + ref |
| contexts/channel/__tests__/socket-router.test.ts | keep-as-is | - | explicit fake adapter，unit test |
| contexts/channel/__tests__/title-from-messages.test.tsx | keep-as-is | - | renderWithWorkspace |
| contexts/channel/handlers/__tests__/error-message.test.tsx | keep-as-is | - | renderWithChannel + ErrorProbe |
| contexts/channel/handlers/__tests__/message.test.tsx | keep-as-is | - | renderWithChannel + SourceProbe |
| contexts/channel/handlers/__tests__/set-model-notification.test.tsx | keep-as-is | - | renderWithChannel |
| contexts/channel/handlers/__tests__/settings-set-model.test.tsx | small-tweak | - | 手工 socket.emit 攔截（legacy） |

## src/features/**/__tests__/

**Summary**: 23 keep-as-is · 0 small-tweak · 0 fake-replace · 4 consumer-merge · 0 structural · 0 duplicate

| file | category | dup-with | notes |
|---|---|---|---|
| features/attach-file/__tests__/attach-file-feature.test.ts | keep-as-is | - | factory |
| features/btw/__tests__/btw-feature.test.ts | keep-as-is | - | factory + slash match |
| features/clear/__tests__/clear-feature.test.ts | keep-as-is | - | factory |
| features/color-theme/__tests__/color-theme-feature.test.ts | keep-as-is | - | factory 有自身邏輯（state shape + execute cycle）；SettingsDialog 走 pill click 不經 execute(); reclassify from consumer-merge after re-audit |
| features/compact/__tests__/compact-feature.test.ts | keep-as-is | - | slash match + invoke |
| features/density/__tests__/density-feature.test.ts | keep-as-is | - | factory 有自身邏輯；reclassify from consumer-merge |
| features/effort/__tests__/effort-feature.test.ts | keep-as-is | - | segmented state |
| features/fast-mode/__tests__/fast-mode-feature.test.ts | keep-as-is | - | toggle |
| features/font-size/__tests__/font-size-feature.test.ts | keep-as-is | - | factory 有自身邏輯；reclassify from consumer-merge |
| features/general-config/__tests__/general-config-feature.test.ts | keep-as-is | - | signal state |
| features/manage-plugins/__tests__/manage-plugins-feature.test.ts | keep-as-is | - | simple callback |
| features/mcp-servers/__tests__/mcp-servers-feature.test.ts | keep-as-is | - | simple callback |
| features/mcp-status/__tests__/mcp-status-feature.test.ts | keep-as-is | - | simple callback |
| features/mention-file/__tests__/mention-file-feature.test.ts | keep-as-is | - | factory |
| features/model/__tests__/model-feature.test.ts | keep-as-is | - | signal + subscribers |
| features/new-conversation/__tests__/new-conversation-feature.test.ts | keep-as-is | - | sendMessage 整合 |
| features/raw-panel/__tests__/raw-panel-feature.test.ts | keep-as-is | - | toggle |
| features/recap/__tests__/recap-feature.test.ts | keep-as-is | - | slash + side-question async |
| features/reload-plugins/__tests__/reload-plugins-feature.test.ts | keep-as-is | - | slash + execute |
| features/resume/__tests__/resume-feature.test.ts | keep-as-is | - | signal state |
| features/rewind/__tests__/rewind-feature.test.ts | keep-as-is | - | signal factory |
| features/rewind/__tests__/RewindDialog.test.tsx | keep-as-is | - | renderWithWorkspace 整合測試；feature 層 UI 對應，scope 合理（audit 初判為 structural 已更正） |
| features/switch-account/__tests__/switch-account-feature.test.ts | keep-as-is | - | signal + execute |
| features/thinking/__tests__/thinking-feature.test.ts | keep-as-is | - | toggle |
| features/usage/__tests__/usage-feature.test.ts | keep-as-is | - | factory 有自身邏輯（execute emits + opens signal + slash.invoke delegates）；reclassify from consumer-merge |
| features/usage/__tests__/AccountUsageDialog.test.tsx | keep-as-is | - | renderWithWorkspace 完整整合 |
| features/view-help/__tests__/view-help-feature.test.ts | keep-as-is | - | factory + fallback URL |

## src/hooks/__tests__/

| file | category | dup-with | notes |
|---|---|---|---|
| useExplorerBrowse.test.tsx | keep-as-is | - | SocketProvider + FakeSummoner |
| useSpeechToText.test.ts | keep-as-is | - | window.SpeechRecognition mock |
| useInputHistory.test.ts | keep-as-is | - | pure hook state |
| useEffectiveColorTheme.test.ts | keep-as-is | - | store + matchMedia stub |
| useBreakpoint.test.ts | keep-as-is | - | matchMedia integration |

## src/stores/__tests__/

| file | category | dup-with | notes |
|---|---|---|---|
| useMessageVisibilityStore.test.ts | keep-as-is | - | pure store getState() |
| usePreferencesStore.test.ts | keep-as-is | - | pure store + migration |

## src/utils/__tests__/

| file | category | dup-with | notes |
|---|---|---|---|
| buildMessagesFromHistory.test.ts | keep-as-is | - | pure util |
| clipboard.test.ts | keep-as-is | - | navigator.clipboard mock |
| cn.test.ts | keep-as-is | - | pure util |
| diff.test.ts | keep-as-is | - | pure util |
| filter-tree.test.ts | keep-as-is | - | pure util |
| format-relative-date.test.ts | keep-as-is | - | pure util |
| format-reset-time.test.ts | keep-as-is | - | pure util |
| get-feedback-label.test.ts | keep-as-is | - | pure util |
| isMessageVisible.test.ts | keep-as-is | - | pure util |
| message-preview.test.ts | keep-as-is | - | pure util |
| model-utils.test.ts | keep-as-is | - | pure util |
| pluralize.test.ts | keep-as-is | - | pure util |
| resume-route.test.ts | keep-as-is | - | pure util |
| tool-group-rules.test.ts | keep-as-is | - | pure util（推定） |

## src/lib/__tests__/ + misc

| file | category | dup-with | notes |
|---|---|---|---|
| lib/__tests__/feature-registry.test.ts | keep-as-is | - | registry pattern |
| lib/__tests__/feature-type.test.ts | keep-as-is | - | type definition |
| lib/__tests__/create-choice-feature.test.ts | keep-as-is | - | feature factory |
| lib/adapters/__tests__/to-menu-item.test.tsx | keep-as-is | - | 純 adapter unit test；audit 初判「搬 components/」已更正（測的是純轉換函式，非 UI 渲染） |
| lib/adapters/__tests__/trailing-renderers.test.tsx | keep-as-is | - | 測兩個 adapter 的 render 輸出，已使用真元件無 `vi.mock('./X')`；位置合理 |

## src/__tests__/ (app-level)

| file | category | dup-with | notes |
|---|---|---|---|
| App.test.tsx | keep-as-is | - | 整合 preferences → `<html>` data-attr |
| App.css.test.ts | keep-as-is | - | CSS 靜態契約（本次 session 建立） |

---

## Cross-file duplicate groups

### Group A — ChannelId hook (3 檔 → 1 檔)
- `contexts/channel/__tests__/ChannelIdContext.test.tsx`（保留）
- `contexts/channel/__tests__/ChannelProvider-id-context.test.tsx`（刪除 / 合併）
- `contexts/channel/__tests__/channelId-in-state.test.tsx`（刪除 / 合併）

### Group B — Settings cycle（4 檔 feature-only 可 merge 到 SettingsDialog）
- `features/color-theme/.../color-theme-feature.test.ts` → merge to `SettingsDialog.test.tsx`
- `features/density/.../density-feature.test.ts` → 同上
- `features/font-size/.../font-size-feature.test.ts` → 同上
- `features/usage/.../usage-feature.test.ts` → merge to `AccountUsageDialog.test.tsx`

### Group C — 簡單 presentational 被 parent 覆蓋
- `components/__tests__/EmptyState.test.tsx` ↔ `WorkspaceLayout.test.tsx`
- `components/__tests__/ErrorFallback.test.tsx` ↔ parent ErrorBoundary 的 e2e flow
- `components/__tests__/ModifiedFilesPanel.test.tsx` ↔ 父元件 file acceptance flow
- `components/command-menu/__tests__/CommandMenu.test.tsx` ↔ `build-menu-items.test.ts`（unit 層）

### Group D — lib/adapters 誤放
- `lib/adapters/__tests__/to-menu-item.test.tsx` → 搬 `components/__tests__/`
- `lib/adapters/__tests__/trailing-renderers.test.tsx` → 搬 `components/ui/__tests__/`

---

## Grand totals (169 files)

| 分類 | 數 | 比例 |
|---|---|---|
| `keep-as-is` | 135 | 80% |
| `small-tweak` | 29 | 17% |
| `consumer-merge` | 0 | 0% |
| `fake-replace` | 0 | 0% |
| `structural` | 0 | 0% |
| `duplicate` | 0 | 0% |（都已完成）

Phase 2 剩餘工作量 **29 檔**（全部是 `small-tweak`）。

**已完成**：
- Phase 2e duplicate: ChannelId 3→1、DiffViewer 字面重複刪除（完成）
- Phase 2b fake-replace: ContentRenderer 3 `vi.mock` → 真元件（完成）
- Phase 2c consumer-merge: 全數誤判，8 檔 reclassify 回 `keep-as-is`（每檔都有自身邏輯，consumer 不覆蓋）

**Audit agent 系統性誤判**：`consumer-merge` 分類需要實際對照 consumer test 的 expect；agent 只看表面 shallow 程度容易誤判。後續 audit 應補強「檢查 consumer test 的 coverage」步驟。
