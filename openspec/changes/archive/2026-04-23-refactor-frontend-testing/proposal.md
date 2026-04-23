## Why

前端測試累積到 172 檔 / ~17k 行，多個共存的慣例互相衝突：

- `vitest-testing` skill 以 server 為主，卻被前端 test 引用
- 部分檔案用 `vi.mock('./Component')` 隔離子元件，失去型別檢查且重構脆弱
- 小型 presentational 元件（Badge、IconButton、PaletteEmpty 類）各自有 shallow `.test`，其實 consumer test 已覆蓋
- Fake 檔案放置不一致（`src/test/fake-*.ts` 平鋪 vs 本 session 新增的 `src/test/fakes/speech-recognition.ts` 子目錄）
- 未明定「外部依賴 vs 內部依賴」的 test double 策略
- `vite.config.ts` 有 `*.integration.test.{ts,tsx}` glob 暗示單元/整合分流，但無檔案使用

這些累積成隱性摩擦：新人不知道去哪寫、重構時測試不穩、fake 找不到。本 change 固化六原則、一檔一檔 audit、按分類批次重構。

## What Changes

### 原則化（寫入 `.claude/skills/frontend-testing/SKILL.md`）

1. **Testing Library first, no unit/integration split** — 單一檔名規則 `*.test.ts[x]`
2. **外部依賴無法真用時 Fake 首選** — 網路/Socket/瀏覽器 API/時間；內部觀察仍是 Spy，內部完全替換（vi.mock）是最後手段
3. **隔離子元件用 Fake Component** — `Fake<Name>` 共用原 prop 型別，勝過 `vi.mock`
4. **測試放在最小有意義的 render root** — 簡單 primitive 透過 consumer 覆蓋
5. **重構時優先補 expect** — 找既有 .test 加 assertion 優於新建檔
6. **Fake 檔統一 `src/test/fake-*.ts[x]`** — 不分子目錄

### 基礎設施遷移

- `src/test/fakes/speech-recognition.ts` → `src/test/fake-speech-recognition.ts`；更新 2 個 import
- 移除 `src/test/fakes/` 空目錄
- `packages/client/vite.config.ts` `include` 移除 `*.integration.test.{ts,tsx}` glob
- Skill 交叉引用更新：`testing-best-practices` 精簡、`vitest-testing` 加 "(server)" clarifier

### Audit + Refactor（Phase 1 + 2）

- Phase 1：172 檔逐一分類（`keep-as-is` / `small-tweak` / `fake-replace` / `consumer-merge` / `structural` / `duplicate`），同時標記**跨檔測重複**（同行為在多處斷言），輸出 `audit.md`
- Phase 2：按分類批次重構。TDD 紀律「expect 不變或等價」— 不允許未遷移地刪除 expect

### 不變（以現有測試覆蓋為約束）

- 全套測試一直保持綠；每批重構結束跑一次完整 vitest
- 重構純屬結構面，不改變被測元件/hook/store 的行為

## Capabilities

### Added Capabilities

- `client-testing`: 前端測試慣例規範。包含六原則、Fake 放置規則、檔名規則、refactor 紀律

## Impact

- 修改：
  - `.claude/skills/frontend-testing/SKILL.md`（主）
  - `.claude/skills/testing-best-practices/SKILL.md`（精簡、交叉引用）
  - `.claude/skills/vitest-testing/SKILL.md`（標題加 server clarifier）
  - `packages/client/vite.config.ts`（glob 移除）
  - Phase 2 中被分類為 small-tweak / fake-replace / consumer-merge / structural 的 test 檔
- 搬檔：
  - `src/test/fakes/speech-recognition.ts` → `src/test/fake-speech-recognition.ts`
- 新增：
  - `openspec/changes/refactor-frontend-testing/audit.md`（Phase 1 產出）
  - `openspec/specs/client-testing/spec.md`（Phase 2 結束 archive 後）
- 風險：
  - Audit 172 檔工作量大；Phase 1 分多個 session 推進
  - Consumer-merge 類重構若誤判，可能遺失 edge case 覆蓋 → 每批必跑 coverage diff
  - 移除 integration glob 後若未來需要再分，要另外引入（此次假設 YAGNI）
