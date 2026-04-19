---
name: cc-office-review
description: cc-office 專案特定的 code review 檢查。搭配通用 code-review skill 使用。當 review cc-office 程式碼時自動套用。
---

# cc-office 專案特定 Code Review

除通用 `/code-review` skill 的審查維度外，本專案額外檢查以下項目。

## Import
- import 放在檔案最頂部，不要 inline import（函式中間寫 import）
- Node.js built-in import（`node:path`, `node:fs`）放最上方

## Zod

- `.passthrough()` / `.loose()` → 改 `z.looseObject()`（Zod v4 deprecated）
- shared schema 只有一個 package 使用 → 搬到該 package
- `payload as { ... }` inline type assertion → 改用 zod schema parse：
  1. 先查 shared schemas 有沒有現有 schema 可用
  2. 沒有才新建，放 shared 讓前後端共用
  3. 不要 inline `z.looseObject({...}).parse(payload)` — 那只是換一種 inline，應該抽成 named schema

## 跨 Package 對齊（shared / summoner / server / client）

- server `emitter.on('event', ...)` 的 event name 跟 shared `socket-events.ts` 定義是否一致
- server `ch.sendRequest('event', ...)` 的 event name 跟 adapter `REQUEST_MAPPINGS` 是否一致
- adapter `transformControlRequest` 產出的 event name 跟 server handler 訂閱的是否一致
- client handler on map 的 event name 跟 server emit 給 client 的是否對齊
- shared `ClientToServerEvents` / `ServerToClientEvents` 定義跟實際 emit/on 是否同步

## summoner（CLI adapter）

- `REQUEST_MAPPINGS` 是否涵蓋所有 `ch.sendRequest` 呼叫的 event name
- adapter transform 每個 case 是否都有 named function（不用 inline arrow）
- `isRecord()` 等 util 是否集中在 `utils.ts`，不重複定義

## server handler

- middleware 是否正確：
  - 需要 channel 且有 callback → `withError(withChannel(handler))`
  - 需要 channel 無 callback → `withChannel(handler)`
  - 需要 socket → `withSocket(handler)`
  - 不需要 channel → 直接註冊
- handler 使用 `ch.sendRequest('event', payload)` 不直接用 protocol subtype
- handler 使用 named function（不用 arrow）
- handler 內 `respondToRequest` 只在 auto-respond 或 CLI-initiated event 使用

## server core

- `Channel` 的 mutable field 必須 private + getter/setter
- `ChannelEmitter` 的 `emit` / `emitToOthers` / `dispatch` 語義區分：
  - `emit` → broadcast 給 channel sockets（server → client）
  - `dispatch` → 呼叫 server handler
  - `dispatchRunnerEvent` → broadcast + dispatch（runner event 專用）

## client handler

- handler 檔案放在 `contexts/channel/handlers/`
- 命名對齊 server：`file.ts`、`message.ts`、`permission.ts`...（無 Handler suffix）
- 只有一個 consumer 的 helper → inline 到 consumer，不獨立檔案
- handler map export 用 `satisfies Record<string, ...>` 確保型別
- effects 和 state handlers 分開 export：`xxxHandlerOn` + `xxxHandlerEffects`

## Icon 慣例

- 優先用 `ui/Icons` facade（re-export heroicons + `ActionButton` + `SlashCommandIcon`）
- 新 icon 需求 → 先找 heroicons `/24/outline`；沒對應才自訂
- 自訂 SVG 情境（合法）：
  - brand mark（`✦`）
  - extension 視覺 parity（`PermissionModeIcons`）
  - dynamic chart（`SparkLegend` `EffortDots`）
- SVG 尺寸慣例：svgBase 用 `width: '100%'; height: '100%'`，由 wrapper `w-X h-X` 控渲染尺寸（跟 `data-font` axis 等比縮放）

## React Compiler 相容性

已啟用 `babel-plugin-react-compiler`。檢查：
- render 時不讀 ref.current（compiler 可能重排序）— ref 只在 useEffect / event handler 裡讀
- component 必須是純函式（相同 props → 相同 output）
- 不依賴 render 順序的 side effect
- 手動 useMemo/useCallback 不必要時可移除（compiler 自動 memoize）

## 測試

- 使用 FakeSummoner + real JSON segments（`@code-quest/summoner/test` 的 `s.*()` builder）
- 驗證 action 發 socket event 用完整 pipeline + `claude.received(...)`，不 spy emit
- client 測試用 `renderWithChannel` / `renderWithWorkspace` + testing-library
- expect 不變原則：重構不改 expect
