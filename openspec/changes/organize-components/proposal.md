# organize-components

## Summary

將 `packages/client/src/components/` 下 100+ 個打平的 component 檔案，依 domain 分類到子目錄。

## Scope

- ChannelProvider 內的 component → `chat/` 資料夾，內部再依 domain 分類
- ChannelProvider 外的 component → `components/` 下依 domain 分類
- 只搬檔案 + 更新 import path，不改任何邏輯

## Structure

```
components/
├── chat/                          ← ChannelProvider 相關
│   ├── conversation/              對話流、訊息顯示
│   ├── compose/                   使用者輸入
│   ├── tool-use/                  tool 執行視覺化
│   ├── plan-review/               plan 審查
│   ├── session/                   session 歷史 / debug
│   ├── renderers/                 共用內容渲染
│   ├── dialogs/                   chat 內觸發的 dialog
│   ├── command-menu/              已存在
│   └── message-blocks/            已存在（tool 相關搬去 tool-use/）
│
├── workspace/                     全域佈局框架
├── project/                       專案 / worktree 管理
├── git/                           Git 操作面板
├── files/                         檔案瀏覽
├── spec/                          Openspec 管理
├── settings/                      全域設定 / plugin / MCP
├── live-session/                  Live session 協作
├── palette/                       已存在
├── icons/                         已存在
└── ui/                            已存在
```

## Constraints

- 純 move + import update，不修改任何 component 邏輯
- 每個 domain 獨立一個 commit，方便 review
- typecheck + test 必須在每個步驟後通過
