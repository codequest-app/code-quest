## Phase 1：Content components 獨立檔案 ✅

- [x] 1.1 每個 message type 抽成獨立 Content component
- [x] 1.2 renderContent 改為 if/else dispatch
- [x] 1.3 測試：2051 tests green

## Phase 2：Handler 去 meta ✅

Handler 只寫 top-level typed fields，component 不再讀 meta。

- [x] 2.1 定義 TopLevelMap（13 個 type 的 typed fields）
- [x] 2.2 所有 handler 改寫 top-level fields（text, tool_use, tool_result, thinking, error, hooks, task, notification, rate_limit, streaming）
- [x] 2.3 所有 component 改讀 top-level fields，移除 meta fallback
- [x] 2.4 Block.meta 雙寫移除（streaming handler 只寫 top-level）
- [x] 2.5 MetaMap 清空，所有 meta 改為 optional
- [x] 2.6 測試 fixture 從 `meta:` 遷移到 top-level fields
- [x] 2.7 測試 assertion 從 `block.meta.x` 改為 `block.x`
- [x] 2.8 測試：2051 tests green

## Phase 3：移除 meta + 型別收尾

目標：Message type narrow 後 component 直接拿 typed props，不用 `as unknown as` cast。

### 3.1 Message discriminated union 收尾 ✅

- [x] 3.1.1 移除 `OptionalMetaMap` — ToolResultMeta / ResultMeta / TextMeta 全移除
- [x] 3.1.2 Message union 簡化：`MessageBase & { type: T } & TopLevel<T>`（無 meta）
- [x] 3.1.3 把 `meta?` 從 Message type 完全移除（unknown_delta/unhandled/result/pending_action 搬到 TopLevelMap）
- [x] 3.1.4 測試：type check + 2051 tests green

### 3.2 消除 `as unknown as` cast ✅

- [x] 3.2.1 NodeContent dispatch narrow — 所有 if (message.type === X) 後直接讀 typed fields
- [x] 3.2.2 移除 NodeContent 裡的 `const m = message as unknown as` pattern（8 個 cast 清除）
- [x] 3.2.3 ToolUseContent / ThinkingContent 改用 narrow 後的 typed message props
- [x] 3.2.4 測試：type check + 2051 tests green

### 3.3 清理遺留 ✅

- [x] 3.3.1 移除 `patchMeta` — fetchOpenFileContent（dead code）一起刪除
- [x] 3.3.2 tool-utils.ts 移除 meta fallback，直接讀 top-level result field
- [x] 3.3.5 刪除 Block.meta field
- [x] 3.3.6 刪除 AssistantTurn.meta field
- [x] 3.3.7 測試：全 package green（2051 tests）
