## Context

前端測試 172 檔累積多個慣例混雜。本 change 固化六原則，並依原則逐檔 audit + 分類重構。Server 測試（`apps/server`）**不在本次範圍**。

## Goals / Non-Goals

**Goals**
- 明定前端測試六原則於 `frontend-testing` SKILL
- 基礎建設（fake 放置、檔名規則、vite.config）一次到位
- 172 檔逐一審查，按分類批次重構；TDD 紀律「expect 不變或等價」
- 重複測試（跨檔 / 檔內）識別並消除
- 每批次後跑完整 vitest，保證綠

**Non-Goals**
- 不動 server 測試（`vitest-testing` skill 只加 clarifier，內容不變）
- 不動被測元件/hook/store 行為
- 不做 upfront 的 test coverage 提升；只做結構面整理
- 不強制一檔對一 commit（按分類批次）

## Decisions

### D1. 六原則優先序

1. Testing Library first，不分單元/整合
2. 外部依賴無法真用時 Fake 首選（決策流程圖見 D3）
3. 隔離子元件用 Fake Component，不用 `vi.mock`
4. 測試放在最小有意義的 render root
5. 重構時優先補 expect
6. Fake 檔統一 `src/test/fake-*.ts[x]`，命名 `Fake<PascalCase>`

### D2. 測試類別與檔名規則

- **只有一種測試檔案**：`<name>.test.ts` / `<name>.test.tsx`，不再有 `*.integration.test.*` 變體
- Fake 檔案平鋪於 `src/test/`，命名 `fake-<kebab>.ts[x]`；exported class/function 命名 `Fake<PascalCase>`

### D3. Test Double 決策流程

```
要測的東西有依賴嗎？
├─ 無 → No Double
└─ 有 → 外部 or 內部？
    ├─ 外部（網路 / Socket / 瀏覽器 API / 時間 / CLI）
    │  ├─ 真依賴在測試便宜可用 → 用真的（e.g. in-memory SQLite）
    │  └─ 否 → Fake 首選（MSW / FakeSummoner / Fake<BrowserAPI> / vi.useFakeTimers）
    │
    └─ 內部（自己 repo 的 module/元件）
       ├─ 觀察呼叫 → Spy (vi.spyOn)
       ├─ 隔離子元件（不連動 deps） → Fake Component（原則 3）
       ├─ 替換一個方法 → Partial Mock (vi.spyOn + mockReturnValue)
       └─ 完全替換整個 module → vi.mock（最後手段）
```

### D4. Audit 分類定義

| 分類 | 條件 | Phase 2 動作 |
|---|---|---|
| `keep-as-is` | 已符合六原則，無 duplicate | 不動 |
| `small-tweak` | 小問題（query priority 違規、imports、命名） | 直接改，補 expect |
| `fake-replace` | 用了 `vi.mock('./Component')` 或模組 mock | 抽/引用 Fake Component，改用 `vi.mock('./X', () => ({ X: FakeX }))` 或由 test helper 帶入 |
| `consumer-merge` | Shallow presentational test，已被 consumer test 覆蓋 | 刪除 shallow test；把未覆蓋的 expect 補進 consumer test |
| `structural` | 測試 scope / 位置嚴重錯置（測了非自己職責） | 搬家，重新 render 正確 root |
| `duplicate` | 同 behavior 在多處斷言 | 保留最貼近 user-POV 的一處，其他 expect 合併或刪除 |

**分類優先順序**：一檔若同時觸犯多條，取嚴重者為主類、其他列 `notes`。

### D5. TDD 紀律「expect 不變或等價」

- 每批重構前：記錄目標檔案的 `expect(` 總數與每個 assertion 的意義
- 重構後：`expect(` 總數 ≥ 原數，且每個原 assertion 都能對應到重構後某處（名稱/位置可變）
- **允許**：rename、arrange 抽進 helper、fake 元件代替 mock、新增更強 assertion
- **禁止**：刪掉 expect 而未遷移、弱化 assertion（e.g. 從 `toBe(5)` 改 `toBeGreaterThan(0)`）

### D6. Audit 產出格式（`audit.md`）

每個 test 檔一行：

```
| file | category | dup-with | notes |
|---|---|---|---|
| src/components/__tests__/Badge.test.tsx | consumer-merge | MessageList.test.tsx | 3 tests 全被覆蓋 |
| src/features/filters/__tests__/X.test.ts | fake-replace | - | 用 vi.mock('./Filter') |
```

Duplicate 欄位 `dup-with` 記錄「同 behavior 也被哪個檔測到」。

### D7. Phase 2 批次單位

按分類分 commit：
- `refactor(client-tests): small-tweak batch (N files)`
- `refactor(client-tests): fake-replace batch (N files)`
- `refactor(client-tests): consumer-merge batch (N files)`
- `refactor(client-tests): structural batch (N files)`
- `refactor(client-tests): duplicate dedup (N files)`

一批 ~10-20 檔；批次結束跑 `pnpm vitest run` 確認綠。

## Risks

- **172 檔審查量大**：Phase 1 會拆多個 session 完成；audit.md 為增量式產出（每 session 補一段）
- **`consumer-merge` 誤判**：若 shallow test 覆蓋了 consumer test 沒測的 edge case，merge 後會遺失。緩解：merge 前抓 coverage diff，確認 branch coverage 不降
- **`duplicate` 誤判**：跨檔同樣 assertion 可能是刻意的（同一行為在不同 context 下驗證）。原則：看 render 的 root 是否相同；不同 root 的同 assertion 保留
- **Skill 改動間接影響**：`testing-best-practices` 精簡可能被其他 skill 引用。grep 核對
