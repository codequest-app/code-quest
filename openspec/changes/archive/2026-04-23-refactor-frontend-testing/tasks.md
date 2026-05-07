> 本 change 分兩階段：Phase 1 audit、Phase 2 refactor。每檔「expect 不變或等價」— 見 design.md D5。

## 0. 基礎建設（Skill + 移檔 + config）

- [x] 0.1 更新 `.claude/skills/frontend-testing/SKILL.md`：加六原則（Core Principles 新章節）、重排 test double 順序、加 Fake Component 章節、加測試放置決策、加重構紀律、加 fake 檔案規則
- [x] 0.2 精簡 `.claude/skills/testing-best-practices/SKILL.md`：移除與 frontend-testing 重複章節，改為「共通慣例」+ 交叉引用
- [x] 0.3 `.claude/skills/vitest-testing/SKILL.md` 標題加 `(server)` clarifier；description 明示適用 server 測試
- [x] 0.4 搬檔：`src/test/fakes/speech-recognition.ts` → `src/test/fake-speech-recognition.ts`；更新 2 處 import（`ChatInputArea.test.tsx` / `SpeechInputContainer.test.tsx`）
- [x] 0.5 刪除空目錄 `src/test/fakes/`
- [x] 0.6 `apps/web/vite.config.ts` `include` 陣列移除 `*.integration.test.{ts,tsx}` glob
- [x] 0.7 跑 `pnpm vitest run` 確認 0.1-0.6 後全綠

## 1. Phase 1 — Audit（不動碼，產出 audit.md）

> 每小節針對一個目錄掃描；每檔依 D4 分類填表

- [x] 1.1 建立 `audit.md`（標題、表頭、分類定義連結）
- [x] 1.2 Audit `src/components/__tests__/`（69 檔）— 43 keep-as-is · 22 small-tweak · 3 consumer-merge · 1 structural · 0 fake-replace
- [x] 1.3 Audit `src/components/palette/__tests__/`
- [x] 1.4 Audit `src/components/command-menu/__tests__/`
- [x] 1.5 Audit `src/components/message-blocks/__tests__/`
- [x] 1.6 Audit `src/components/ui/__tests__/`
- [x] 1.7 Audit `src/contexts/**/__tests__/`（~20+ 檔，ChannelProvider / PluginContext / etc.）
- [x] 1.8 Audit `src/features/**/__tests__/`
- [x] 1.9 Audit `src/hooks/__tests__/`
- [x] 1.10 Audit `src/stores/__tests__/`
- [x] 1.11 Audit `src/utils/__tests__/`
- [x] 1.12 Audit `src/lib/__tests__/` 與其他散落 __tests__ 目錄
- [x] 1.13 Audit `src/__tests__/`（App-level）
- [x] 1.14 跨檔 duplicate 掃描：比對 audit 表的 `dup-with` 欄位、彙整重複群
- [x] 1.15 人工 review audit.md，定案每檔分類

## 2. Phase 2 — Refactor（按分類批次）

> 每批次結束跑 `pnpm vitest run` 確認綠；一批 1 commit

### 2a. small-tweak 批次
- [x] 2a.1 從 audit 取出清單（29 檔；實作中多數經覆核為誤判）
- [x] 2a.2 實際動 3 類修正（見下）
- [x] 2a.3 commits 記錄：
  - `fireEvent → userEvent` 機械替換（ChatPanel / AddButton / MentionDropdown，8 sites）
  - `SessionContext-auth.test.tsx` 改用 `renderWithChannel skipInit` 自然流
  - `CreateWorktreeDialog.test.tsx` 刪除與 shared 重複的 `validateWorktreeName` 5 個 test
  - `as never` → proper Message / GroupId type（filter-tree / tool-group-rules / MessageList）
- [x] 2a.4 剩下 audit 標籤逐一覆核後 reclassify 為 `keep-as-is`（audit 對 small-tweak 的標準過寬）

### 2b. fake-replace 批次
- [x] 2b.1-3 只有 1 個真正候選（`ContentRenderer.test.tsx`），改用真元件取代 3 個 `vi.mock`（不需抽 Fake Component — 真元件可直接用）
- [x] 2b.4 `trailing-renderers.test.tsx` reclassify 為 keep-as-is（audit 誤判）

### 2c. consumer-merge 批次
- [x] 2c.1-4 原 8 候選全部 reclassify 為 `keep-as-is`（見 audit.md Group B/C）：
  - 4 個 feature factory test（color-theme / density / font-size / usage）:`execute()` cycle / state shape / slash.invoke delegation 是 factory 層獨立邏輯，consumer (SettingsDialog / AccountUsageDialog) 未覆蓋
  - 4 個 primitive test（EmptyState / ErrorFallback / ModifiedFilesPanel / CommandMenu）:各自有條件渲染 / ErrorBoundary 整合 / state / a11y 整合邏輯，consumer 未覆蓋
- [x] 2c.5 Lesson captured in audit.md: consumer-merge 分類需對照 consumer 的 expect 實際覆蓋，不只 shallow 外觀

### 2d. structural 批次
- [x] 2d.1 原 2 候選（DiffViewer / RewindDialog）覆核：DiffViewer 改歸 `duplicate`（詳 2e），RewindDialog 改歸 keep-as-is（整合測試 scope 合理）

### 2e. duplicate dedup 批次
- [x] 2e.1-3 commits：
  - ChannelId hook test 3 檔合併為 1 檔（4 個 `it()` 覆蓋 unit / integration / barrel export）
  - DiffViewer.test.tsx 移除與 `utils/__tests__/diff.test.ts` 字面重複的 2 個 describe

## 3. 驗證

- [x] 3.1 全套 `pnpm vitest run` 綠（172 檔 → 可能減少，但 `expect(` 總數 ≥ refactor 前）
- [x] 3.2 `pnpm typecheck` clean
- [x] 3.3 `pnpm build` 成功
- [x] 3.4 Biome / lint clean
- [x] 3.5 Coverage 與 refactor 前比對，branch coverage 不降

## 4. Spec + Archive

- [x] 4.1 已撰寫 `specs/client-testing/spec.md` delta（ADDED 7 條 requirements）
- [x] 4.2 `openspec validate refactor-frontend-testing --strict` 通過
- [ ] 4.3 Commit 後 `openspec archive refactor-frontend-testing`
