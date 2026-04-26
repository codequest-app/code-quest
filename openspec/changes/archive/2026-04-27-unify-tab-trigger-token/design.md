## Context

四個元件的 tab trigger 視覺幾乎相同，差別僅在 size：

| 元件 | padding | font | 額外 |
|------|---------|------|------|
| CreateWorktreeDialog | `px-3 py-1.5` | `text-xs` | — |
| SpecModal (TabButton) | `px-3 py-1.5` | `text-xs` | — |
| RightPane | `h-9 justify-center` | `text-xs` | `flex-1 gap-1.5` |
| ManagePluginsDialog | `px-3 py-2` | `text-sm` | `font-medium transition-colors` |

共同視覺：`border-b-2 border-transparent text-text-muted hover:text-text data-[state=active]:border-accent data-[state=active]:text-text`

## Goals / Non-Goals

**Goals:**
- 抽出共用視覺 token 到 `_tokens.ts`，只含 active indicator + 文字色
- 各 consumer 用 `cn(tabTrigger, '自己的 size/layout')` 組合
- SpecModal 同步遷移到 Radix Tabs（順便完成 radix-tabs-migration 的 task 3.1–3.2）
- 刪除 `TabButton.tsx`

**Non-Goals:**
- 不統一 padding / font-size（各場景需求不同）
- 不動 CommandPalette、TabBar、QuestionContent

## Decisions

### D1: token 放 `_tokens.ts`，命名 `tabTrigger`

```ts
export const tabTrigger =
  'border-b-2 border-transparent text-text-muted hover:text-text data-[state=active]:border-accent data-[state=active]:text-text';
```

不含 padding、font-size、layout — 這些由 consumer 自行加。理由：四個 consumer 的 size 都不同，強制統一反而需要 variant 參數，過度設計。

### D2: `-mb-px` 由 consumer 決定

`-mb-px` 是讓底線和容器 `border-b` 重疊的 hack，取決於容器是否有 `border-b border-border`。放在 consumer 的 `Tabs.List` 或 trigger 上，不放進 token。

### D3: ManagePluginsDialog 的 `font-medium` 放 consumer

`data-[state=active]:font-medium` 只有 ManagePluginsDialog 用，不放進共用 token。

## Risks / Trade-offs

- **[Token 太細]** → 只有 4 行 class，但消除了 4 處重複。未來新增 tab 時有單一參考點。
