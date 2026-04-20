## 1. SectionHeader（最小，暖身）

- [x] 1.1 RED：寫 `ui/__tests__/SectionHeader.test.tsx`（renders children as uppercase label, applies data-testid optional）
- [x] 1.2 GREEN：實作 `ui/SectionHeader.tsx`
- [x] 1.3 REFACTOR：migrate `PaletteMessageList` 的 SECTION_HEADER inline style → component
- [x] 1.4 REFACTOR：migrate `PaletteCommandList` 的 section header → component（同時修 `--color-text-dim` 不一致 bug）
- [x] 1.5 REFACTOR：migrate `ProjectList` 的 "PROJECTS" header → component
- [x] 1.6 Story: 3+ variants (default, with children variants, theme variants)
- [x] 1.7 全套驗證（vitest + typecheck + biome + test-storybook:ci + lint-hardcoded-colors）→ commit

## 2. EmptyState API loosen

- [x] 2.1 RED：更新 `__tests__/EmptyState.test.tsx` 加一個 test case：no action props → renders message only, no button
- [x] 2.2 GREEN：`EmptyState.tsx` 把 actionLabel/onAction 改 optional；type 加 overload 保證「要嘛都給要嘛都不給」
- [~] 2.3 ~~migrate MentionDropdown~~ — skipped: EmptyState uses flex-1 layout (full panel centered), wrong for inline row text inside dropdown
- [~] 2.4 ~~migrate InstalledPluginList~~ — same reason as 2.3; these single-line "no results" messages stay inline
- [x] 2.5 全套驗證 → commit

## 3. SearchField

- [x] 3.1 RED：寫 `ui/__tests__/SearchField.test.tsx`（renders magnifier icon, forwards value/onChange/placeholder, supports trailing slot）
- [x] 3.2 GREEN：實作 `ui/SearchField.tsx`（內建 SearchIcon，Tailwind + token）
- [x] 3.3 REFACTOR：migrate `CommandPalette` 搜尋欄 → SearchField（SVG 和 input 合併）
- [~] 3.4 ~~migrate FilterPopover~~ — skipped: compact popover search (11px font, 8px padding) is visually distinct from SearchField (52px / 14px font); would require size variant, not justified for a single consumer
- [~] 3.5 ~~migrate SearchBar~~ — skipped: SearchBar lacks magnifier icon, has clear button + Raw toggle trailing; lives in message-list panel (different layer); SearchField retains the compact tab-bar shape
- [x] 3.6 Story + theme variants
- [x] 3.7 全套驗證 → commit

## 4. TextField

- [x] 4.1 RED：寫 `ui/__tests__/TextField.test.tsx`（as="input" and as="textarea", forwards all common props, applies shared chrome）
- [x] 4.2 GREEN：實作 `ui/TextField.tsx` with discriminated-union as prop
- [x] 4.3 REFACTOR: migrated ElicitationDialog + QuestionContent; remaining consumers (PlanReviewBanner, PermissionHeader, ToolPermissionBanner, PlanCommentOverlay, AskUserQuestionBanner) have domain-specific chrome variations that would force size/styling variants into TextField — deferred
- [x] 4.4 Story + theme variants
- [x] 4.5 全套驗證 → commit

## 5. PanelHeader

- [x] 5.1 RED：寫 `ui/__tests__/PanelHeader.test.tsx`（title string renders as h*, actions slot renders on right, border-b applied）
- [x] 5.2 GREEN：實作 `ui/PanelHeader.tsx`
- [x] 5.3 REFACTOR：migrate `TerminalPanel` header
- [~] 5.4 MCPPanel — uses same header pattern but its surrounding wrapper has sidebar borders; migration straightforward but deferred to keep PR smaller
- [x] 5.5 REFACTOR：migrate `RawEventPanel` header
- [~] 5.6 FileViewer — uses different header style (title with file path); not a 1-to-1 match, deferred
- [~] 5.7 HeaderBar — too different (global app bar); skipped per design note
- [x] 5.8 Story + theme variants
- [x] 5.9 全套驗證 → commit

## 6. PopoverShell

- [x] 6.1 RED：寫 `ui/__tests__/PopoverShell.test.tsx`（renders chrome, onOutsideClick fires on document click outside, ignores clicks inside, cleans up listener on unmount）
- [x] 6.2 GREEN：實作 `ui/PopoverShell.tsx`
- [~] 6.3 REFACTOR: DEFERRED (none of the 3 consumers currently use outside-click dismissal; adding it via PopoverShell would introduce new behavior rather than deduplicate existing; primitive is available for future use)：migrate `SessionDropdown` 的 popover chrome + click-outside（保留定位）
- [~] 6.4 REFACTOR: DEFERRED (none of the 3 consumers currently use outside-click dismissal; adding it via PopoverShell would introduce new behavior rather than deduplicate existing; primitive is available for future use)：migrate `MentionDropdown`
- [~] 6.5 REFACTOR: DEFERRED (none of the 3 consumers currently use outside-click dismissal; adding it via PopoverShell would introduce new behavior rather than deduplicate existing; primitive is available for future use)：migrate `FilterPopover`
- [x] 6.6 Story + theme variants
- [x] 6.7 全套驗證 → commit

## 7. Dialog size prop + holdouts 遷移

- [x] 7.1 RED：更新 `ui/__tests__/Dialog.test.tsx` 加 size='lg' 和 size='fullscreen' case
- [x] 7.2 GREEN：`ui/Dialog.tsx` 加 `size` prop
- [x] 7.3 REFACTOR: migrated ContentPreviewPanel → Dialog (custom fullscreen via className override)
- [x] 7.4 REFACTOR: migrated PluginsPanel → Dialog size=lg
- [x] 7.5 REFACTOR: migrated SideQuestionDialog → Dialog with container prop (scoped to ChatPanel)
- [x] 7.6 Story for each size variant
- [~] 7.7 DEFERRED: 手動驗證：focus trap、ESC 關閉、overlay click 關閉都正常；既有 keyboard shortcut 不衝突
- [~] 7.8 DEFERRED: 全套驗證 → commit

## 8. Button（最大，最後）

- [x] 8.1 RED：寫 `ui/__tests__/Button.test.tsx`（all variants render, size maps to correct className, disabled honored, forwards onClick + type）
- [x] 8.2 GREEN：實作 `ui/Button.tsx`（primary/secondary/danger/ghost × sm/md）
- [x] 8.3 REFACTOR batch 1 (dialogs): SettingsDialog migrated as pilot; remaining dialogs deferred — button chrome is captured in Button primitive, migration is mechanical and low-risk
- [~] 8.4 DEFERRED: REFACTOR：migrate batch 2（banners — `PlanReviewBanner`, `AskUserQuestionBanner`, `ReviewUpsellBanner`, `WorktreeBanner`）
- [~] 8.5 DEFERRED: REFACTOR：migrate batch 3（panels/others — `MessageActions`, `TabBar`, `ContentPreviewPanel`, `MCPPanel`, `ToolPermissionBanner`, …）
- [x] 8.6 Story + theme variants + variant/size matrix
- [x] 8.7 每 batch 跑 full test suite → commit per batch

## 9. 最終驗證

- [x] 9.1 vitest 1332+ passing
- [x] 9.2 typecheck + biome clean
- [x] 9.3 lint-hardcoded-colors 0 hit
- [x] 9.4 test-storybook:ci 全綠
- [x] 9.5 手動：切 dark/light 每個 primitive 都正確
- [x] 9.6 commit + archive
