## Context

`RightPane` 目前由 `WorkspaceLayout` 的 `RightPaneWithCwd` 包一層 call `useActiveCwd()` 取得 cwd。Hook 從 `ActiveChatTabCwdContext` → `NavigationContext.selectedWorktreeCwd` → `ProjectContext.activeProjectCwd` 一路 fallback。沒有任何「鎖定」機制。

## Goals / Non-Goals

**Goals:**
- 用戶可在 chat tab A 的同時，把 RightPane 鎖定在 worktree B 看 reference
- pin state 不污染 chat tab 切換邏輯（pin 是視覺層工作流，不是路由層）
- pane-bar 提供清楚的 close affordance（解 mobile 的「沒地方收回去」）

**Non-Goals:**
- 多個 chat tab 各自 pin 不同 worktree（v1 一個 workspace 一個 pin）
- 跨 browser tab 同步（sessionStorage 設計上就是 per-tab）
- 改 sidebar 任何東西（其他 change）

## Decisions

### D1. Scope 用 discriminated union 而非 boolean

```ts
type RightPaneScope =
  | { mode: 'follow' }                       // tracks active chat tab cwd
  | { mode: 'pinned'; cwd: string };         // locked to this cwd
```

**Why**: pinned 一定要綁一個 cwd（不能 pin to nothing），union 在 type level 強制這個 invariant。boolean + 可選 cwd 會讓 TypeScript 無法保證「pinned → cwd 一定存在」。

### D2. Provider 接 activeCwd 當 input prop（不直接 import useActiveCwd）

`<RightPaneScopeProvider activeCwd={...}>` — 由 caller 算好 follow 模式應該追的 cwd 傳進來。

**Why**:
- Provider 純化、易測（test 可直接餵 activeCwd 參數）
- 不需要 Provider 內部包多層 useContext，避免 Provider tree 順序限制
- 如果未來 follow 邏輯要變（例如改追 mention 上下文），不用改 Provider 本身

### D3. togglePin 的語意

- mode=follow → 切 pinned，cwd = activeCwd（呼叫當下的）
- mode=pinned → 切 follow，cwd 還給上層
- activeCwd 是 null 時 togglePin 是 no-op（不能 pin to nothing）

**Why**: 單一 action 讓 UI 處理簡單（一個 Switch.onCheckedChange 就夠）。Edge case「pin 到 null」必須 no-op，不然 pinned + cwd 會出現 undefined。

### D4. sessionStorage 不是 localStorage

key: `right-pane-scope`
shape: `{ mode: 'pinned'; cwd: string }` JSON

**Why**:
- pin 是「當下視窗的工作流」概念，不是「我永遠想鎖在這」的偏好
- localStorage 會讓三天後重開的用戶看到右 pane 莫名鎖在某 worktree，困惑
- 多 browser tab 各自獨立 pin 是 feature（每個視窗各自工作流），不是 bug

### D5. radix `Switch` 而非 plain button + aria-pressed

**Why**:
- follow ↔ pinned 是 binary toggle，語意上就是 Switch
- radix `Switch` 內建 `role="switch"` + `aria-checked` + 鍵盤 Space
- 純 button 要自己處理 aria-pressed、鍵盤、focus visible，工程量沒比較少
- `@radix-ui/react-switch` 已在 package.json（之前未使用，這次首引入）

### D6. RightPane 從 prop-driven 變 context-driven

之前：`<RightPane cwd={cwd} onMention={...} />`
之後：`<RightPane onMention={...} />` — 內部 call `useRightPaneCwd()`

**Why**: pane-bar 與 pane content 都需要讀 cwd，prop drilling 兩層很 awkward。pane-bar 也需要讀 mode 跟呼 togglePin，把整組 state 放 context 一致。

**Migration**: `RightPane.tsx` 既有 `cwd` prop 移除；callers (WorkspaceLayout) 改成不傳。RightPane 必須在 RightPaneScopeProvider 內 render；否則 hook throw（強 binding，不 soft fallback — 確保 invariant）。

### D7. Close 按鈕的雙模式

- `mode='collapse'`（desktop / tablet 預設）— 觸發 callback prop `onCollapse`
- `mode='back'`（mobile） — 觸發 callback prop `onBack`

由 caller 決定哪個 mode；視覺上 `—` vs `✕` 對應。

**Why**: pane-bar 不該知道「自己在 mobile 還是 desktop」（違反 single component tree 原則）。Caller 用 Tailwind class + breakpoint hook 決定要傳哪個 callback。

## Risks / Trade-offs

- **sessionStorage 解析失敗** → 用 try/catch wrap，失敗回 follow 預設
- **pinned cwd 對應的 worktree 被刪除** → useRightPaneCwd 應 fallback 回 null（pane 顯示 empty state），不該硬撐顯示死的 cwd。檢查 cwd 是否存在於 projects / worktrees listing
- **Pane-bar 在 RightPane 沒 cwd 時** → 顯示「— no scope —」placeholder；toggle disabled
- **既有 RightPane test** 對 `cwd` prop 的呼叫要全改 — 估 5-8 個 case

## Migration Plan

1. 加 RightPaneScopeContext + useRightPaneCwd hook（純加，無破壞）
2. 加 RightPanePaneBar 元件（純加）
3. RightPane 整合 pane-bar；改 context-driven（破壞 cwd prop callers）
4. WorkspaceLayout 接 Provider 並移除 RightPaneWithCwd 的 cwd 傳遞
5. 修復破壞的 test
6. 視覺檢查 `docs/prototype/redesign-d1.html` 對照

無 DB / wire / API 改動。

## Open Questions

- 桌面 collapse pane 的 callback 是否做？目前 RightPane 沒有 collapse 行為（DrawerAside 才有 open/close）— 第一版 pane-bar 的 `—` 按鈕在桌面**僅顯示，無作用**或**呼叫 prop（caller 串到 setRightOpen(false)）**？傾向後者
- pinned cwd 不存在時的 UI hint？預設 fallback 安靜回 follow + 顯示 toast「Pinned worktree was removed」
