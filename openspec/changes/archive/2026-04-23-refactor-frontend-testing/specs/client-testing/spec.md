## ADDED Requirements

### Requirement: Frontend tests use Testing Library style and a single file-name convention

前端 (`apps/web`) 測試 MUST 以 React Testing Library 的「使用者視角」風格撰寫；檔名 MUST 為 `*.test.ts` 或 `*.test.tsx`，**不得**引入 `*.integration.test.*` 等變體。

#### Scenario: single file-name suffix

- **WHEN** 新增或重命名前端測試檔
- **THEN** 檔名僅允許 `*.test.ts` / `*.test.tsx`
- **AND** `apps/web/vite.config.ts` `include` 只保留 `src/**/*.test.{ts,tsx}` 一條 glob

#### Scenario: test renders meaningful user tree

- **WHEN** 測試一個有使用者可見行為的元件
- **THEN** 使用 `render()` + testing-library query（優先序 `getByRole > getByLabelText > getByPlaceholderText > getByText > getByDisplayValue > getByAltText > getByTestId`）
- **AND** 不使用淺層渲染 / shallow render

### Requirement: External dependencies use Fake before other test doubles

當測試對象依賴外部系統（網路、Socket.IO、瀏覽器 API、時間、CLI 等）且真實依賴在測試環境不易使用時，MUST 優先以 Fake 取代；內部 module 的觀察 MUST 使用 Spy；完全替換整個 module（`vi.mock`）為最後手段。

#### Scenario: network interactions use MSW

- **WHEN** 測試中有 `fetch` 或其他 HTTP 呼叫
- **THEN** 使用 MSW handlers（proxy fake）攔截，不直接 `vi.mock('node:http')` 或 `vi.spyOn(global, 'fetch')`

#### Scenario: socket + CLI interactions use FakeSummoner

- **WHEN** 測試中需要 socket.io 或 CLI 子程序
- **THEN** 使用 `FakeSummoner` / `renderWithChannel` / `renderWithWorkspace`

#### Scenario: browser APIs use Fake<API>

- **WHEN** 測試中需要 `SpeechRecognition` 等瀏覽器 API
- **THEN** 使用 `Fake<API>` + `setup<API>()` helper；該 helper 須在測試前裝上 window 屬性、測試後清除

#### Scenario: time uses fake timers

- **WHEN** 測試行為涉及 `setTimeout` / `setInterval` / `Date.now`
- **THEN** 使用 `vi.useFakeTimers()`，不用 `Promise` 輪巡或真實等待

#### Scenario: internal module observation uses Spy

- **WHEN** 要觀察自家 module 的呼叫而不替換行為
- **THEN** 使用 `vi.spyOn`（real code 仍執行），避免 `vi.mock`

### Requirement: Component isolation uses Fake Component, not vi.mock

當測試需要隔離子元件（不想連動其 deps）時，MUST 撰寫 `Fake<Name>` React 元件共用原 prop 型別，並透過 `vi.mock('./X', () => ({ X: FakeX }))` 或 dependency-injection 測試 helper 帶入；MUST NOT 使用 `vi.mock('./X', () => ({ X: () => null }))` 這類 inline 匿名 mock。

#### Scenario: fake component preserves prop contract

- **WHEN** 為 `Component` 撰寫 `FakeComponent`
- **THEN** `FakeComponent` 的 props 型別與 `Component` 完全相同（用原始 props interface）
- **AND** 測試可透過 `data-testid` 斷言 parent 傳入的 prop 值

#### Scenario: fake components live in src/test/

- **WHEN** 新增一個 Fake Component
- **THEN** 檔案位於 `apps/web/src/test/fake-<kebab>.tsx`
- **AND** 匯出名稱為 `Fake<PascalCase>`

### Requirement: Tests live at the smallest meaningful render root

簡單 presentational primitive（例如 Badge、IconButton、PaletteEmpty）SHOULD NOT 建立專屬 `.test` 檔；其行為 MUST 透過最近的、具自身邏輯 consumer 的測試覆蓋。只有具自身邏輯的元件、hook、store、util MUST 擁有專屬 test 檔。

#### Scenario: shallow presentational test is merged

- **WHEN** 一個 primitive `X` 的測試只斷言 className 與 children prop（shallow behavior）
- **AND** X 的 consumer `Y` 的測試已實際 render X 並涵蓋這些行為
- **THEN** 移除 `X.test.tsx`；把未覆蓋的 assertion 補進 `Y.test.tsx`

#### Scenario: stateful component keeps its own test

- **WHEN** 元件有自身 state / hook subscription / 複雜渲染邏輯（如 `EffortSwitch` 的 thumb 位置計算）
- **THEN** 該元件 MUST 有專屬 `.test` 檔

### Requirement: Refactor preserves assertions (expect unchanged or equivalent)

前端測試的重構 MUST 保持 `expect(` 總數不減；每一個原本的 assertion MUST 能在重構後找到對應（可以移位、可以合併語意相同的多個斷言成一個，但不得弱化或丟失）。

#### Scenario: assertion count does not decrease

- **WHEN** 重構 `<file>.test.tsx`
- **THEN** 重構後 `grep -c 'expect('` ≥ 重構前
- **OR** 若有必要合併（例如同一個 assert 在 consumer 中已存在），在 PR 描述或 commit message 中明列遷移對應

#### Scenario: assertion strength is preserved

- **WHEN** 重構一個 assertion
- **THEN** 新 assertion 的失敗條件集合 ⊇ 原 assertion（例如 `toBe(5)` 不得弱化為 `toBeGreaterThan(0)`）

### Requirement: Fake test files follow a single naming and placement rule

所有測試用 Fake 檔案（browser API fakes、component fakes、network fakes、time fakes）MUST 放在 `apps/web/src/test/` 平鋪層級，命名格式 `fake-<kebab>.ts[x]`。

#### Scenario: fake file naming

- **WHEN** 新增一個 Fake
- **THEN** 檔名符合 `fake-<kebab>.ts[x]`
- **AND** exported symbol 命名為 `Fake<PascalCase>`（class 或元件函式）
- **AND** 若有 setup helper，命名為 `setup<PascalCase>()`

#### Scenario: no nested fake subdirectory

- **WHEN** audit `apps/web/src/test/`
- **THEN** 不存在 `fakes/` 子目錄
- **AND** 所有 `fake-*.ts[x]` 位於同一層級

### Requirement: Refactor when adding tests prefers extending existing files

當一個待驗證行為與某既有 `.test` 檔同屬一個 render root / unit 時，MUST 優先在該既有檔加 `it()` / `expect()`，而非新建測試檔；只有當行為與既有檔 scope 明顯不同時才新建。

#### Scenario: extend existing instead of new file

- **WHEN** 需要為元件 `X` 的新行為加測試
- **AND** 已存在 `X.test.tsx`
- **THEN** 在 `X.test.tsx` 新增 `it()` 區塊，而不是建立 `X.new-behavior.test.tsx`
