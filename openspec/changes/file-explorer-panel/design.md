## Context

cc-office 目前的 layout 是扁平結構：`TabBar → ChatPanel`。所有 Claude session 都在 server process 的 cwd 或已知 channel 的 cwd 中工作。使用者無法瀏覽 server 機器上的目錄結構來選擇不同的 working directory。

現有相關基礎設施：
- `file:list` handler — channel-scoped 的檔案列表（fuzzy search + directory browse），綁定 `withChannel`
- `react-resizable-panels` v4.6.2 — 已安裝但未使用
- `TabContext.createNewTab({ cwd })` — 已支援帶 cwd 建立新 tab
- `ChannelEmitter` — 支援不綁 channel 的 handler（handler 收到 `ch = null`）
- `config.ts` — 集中管理 env 設定，使用 `dotenv/config`

## Goals / Non-Goals

**Goals:**
- 使用者可以在 web UI 中瀏覽 server 機器上的目錄結構
- 使用者可以選定任意目錄，在該 cwd 開啟新的 Claude session tab
- 透過環境變數限制可瀏覽的目錄範圍（可選）
- 建立可擴展的 VS Code 風格 layout（Activity Bar + Sidebar），為未來的 panel 打基礎
- 記住最近使用過的 cwd，方便快速存取

**Non-Goals:**
- 不做檔案點擊/預覽/編輯（MVP 只列目錄）
- 不做 fuzzy search（可之後加）
- 不改動現有 `file:list` handler（保持 channel-scoped）
- 不做 drag-and-drop 或檔案操作（rename、delete 等）
- 不做 right sidebar 的重構（RawEventPanel 維持現狀）

## Decisions

### D1: Layout 採用 VS Code 風格三欄結構

```
┌──┬─────────────┬─────────────────────────────────────┐
│  │             │ [Tab1] [Tab2] [+]                    │
│  │  Sidebar    ├─────────────────────────────────────┤
│A │  (resizable)│                                     │
│B │             │  ChatPanel                           │
│  │  File       │                                     │
│  │  Explorer   │                                     │
│  │  Panel      │                                     │
│  │             │                                     │
└──┴─────────────┴─────────────────────────────────────┘
```

**結構層級：**
```
WorkspaceLayout (layout shell — 只管 ActivityBar + Sidebar + main 排列)
├── ActivityBar              ← icon 列，切換 sidebar panel
├── PanelGroup (horizontal, react-resizable-panels)
│   ├── Panel (sidebar)      ← resizable，可收合
│   │   └── FileExplorerPanel
│   ├── PanelResizeHandle
│   └── Panel (main)
│       └── EditorArea       ← 原 WorkspaceLayout 的內容，原封不動搬過來
│           ├── TabBar
│           └── ChannelProvider (per tab)
│               └── ChatPanel
```

**Component 拆分：**
- `WorkspaceLayout` — 升級為 layout shell，只負責 ActivityBar + PanelGroup + Sidebar 的排列
- `EditorArea`（新）— 從 WorkspaceLayout 提取，內容就是原本 WorkspaceLayout 的 TabBar + per-tab ChatPanel 邏輯，一字不改

**Rationale:** 原 WorkspaceLayout 非常單純（TabBar + tabs），把 ActivityBar/Sidebar 全塞進去會讓它變大雜燴。拆出 EditorArea 後職責清晰：layout shell vs editor content。且 EditorArea 只是 rename + 搬出，不改任何 tab/channel 邏輯，風險最低。

**替代方案：** 只放一個 toggle button 不做 Activity Bar。但 Activity Bar 成本極低（一條 icon 列），且未來幾乎一定會加 Search、Session History 等 panel，現在做好省之後重構。

**Rationale:** 使用者已有 VS Code 的肌肉記憶。Activity Bar 是全域的（不屬於任何 tab），這符合 File Explorer「選目錄開 tab」的語意。

### D2: 使用已安裝的 `react-resizable-panels` 實作 resizable sidebar

專案已有 `react-resizable-panels` v4.6.2 依賴。使用 `PanelGroup` + `Panel` + `PanelResizeHandle` 組合實作左側 sidebar 的拖拉調整寬度。

- 預設 sidebar 寬度：20%（`defaultSize={20}`）
- 最小寬度：15%（`minSize={15}`）
- 最大寬度：40%（`maxSize={40}`）
- 收合時完全隱藏（`collapsible={true}`）

**替代方案：** 自建 drag handle（CSS resize / mousedown tracking）。但既然已有成熟套件且已安裝，沒有理由重造。

### D3: `explorer:browse` 為獨立 socket handler，不綁 channel

新增 `explorer:browse` event，handler 不使用 `withChannel`，直接接收 `(ch: null, payload, socket, cb)`。

**Socket 協議：**

```typescript
// Client → Server
'explorer:browse': (payload: { path?: string }, cb: (response) => void) => void

// Response
{ directories: Array<{ name: string; path: string }> }
```

- `path` 為空或 undefined → 列出 allowed roots（或 home 目錄）
- `path` 為目錄路徑 → 列出該目錄下的子目錄

**Rationale:** File Explorer 是全域功能，不需要也不應該綁定某個 channel。跟 `file:list` 分開，因為語意、scope、middleware 需求都不同。

### D4: 安全限制透過 `FILE_EXPLORER_ROOTS` 環境變數

```env
# 不設定 = 以 home 目錄為 root（預設安全）
# 設定 = 只能瀏覽這些目錄底下（逗號分隔）
FILE_EXPLORER_ROOTS=/Users/user/projects,/Users/user/work
```

Server 端 config.ts 新增：
```typescript
explorerRoots: process.env.FILE_EXPLORER_ROOTS
  ? process.env.FILE_EXPLORER_ROOTS.split(',').map(s => s.trim()).filter(Boolean)
  : [os.homedir()]
```

**Path validation 規則：**
1. 解析請求路徑為 absolute path（`resolve`）
2. 檢查是否為 `explorerRoots` 中某個 root 的子目錄（`startsWith`）
3. 不通過 → 回傳空結果（不洩漏錯誤訊息）

**替代方案：** 不設定就不限制。但考慮到 cc-office 可能跑在共用 server 上，預設限制為 home 目錄比較安全。

### D5: 使用 `@headless-tree/react` 實作目錄樹（async lazy load）

安裝 `@headless-tree/core` + `@headless-tree/react`，使用 `asyncDataLoaderFeature` 實作 lazy load 目錄樹。

**為什麼用 headless-tree 而非自建或 react-arborist：**
- **Headless**：不帶預設 UI，完全用自己的 JSX + tailwind styling，跟專案風格一致
- **原生 async lazy load**：`asyncDataLoaderFeature` 的 `getChildrenWithData` 完美對應 `explorer:browse` socket call，內建 loading state 追蹤和 cache management
- **Bundle 極小**：9.5kB core + 0.4kB React bindings
- **內建 keyboard nav + accessibility**：W3C Navigation Treeview Pattern，不用自建
- **react-arborist 不適合**：不原生支援 lazy load children（假設 data 完整傳入），且帶預設 UI

**Client 端整合：**

```typescript
import { asyncDataLoaderFeature } from '@headless-tree/core';
import { useTree } from '@headless-tree/react';

const tree = useTree<DirectoryItem>({
  rootItemId: 'root',
  getItemName: (item) => item.getItemData().name,
  isItemFolder: () => true,  // 全部都是目錄
  createLoadingItemData: () => ({ name: 'Loading...', path: '' }),
  dataLoader: {
    getChildrenWithData: async (itemId) => {
      const path = itemId === 'root' ? undefined : itemId;
      const { directories } = await browse(path);
      return directories.map(d => ({ id: d.path, data: d }));
    },
  },
  features: [asyncDataLoaderFeature],
});
```

**Rendering pattern（flat list）：**
```tsx
<div {...tree.getContainerProps()}>
  {tree.getItems().map((item) => (
    <div
      key={item.getId()}
      {...item.getProps()}
      style={{ paddingLeft: `${item.getItemMeta().level * 16}px` }}
    >
      {item.isExpanded() ? '📂' : '📁'} {item.getItemName()}
    </div>
  ))}
</div>
```

**狀態由 headless-tree 內部管理：** expandedItems、focusedItem、loadingItems 等全部由 library 處理。不需要額外的 zustand store 或 local state 來管 tree structure。

**Server 實作不變：** 使用 `readdirSync` + `Dirent`，只列 `isDirectory()` 的 entry。過濾隱藏目錄（`.` 開頭）和常見忽略目錄（`node_modules`、`.git`、`dist` 等）。

### D6: 目錄樹只列目錄，不列檔案

MVP 目的是選 working directory，不是瀏覽檔案。列出檔案會：
- 增加每次 browse 的回傳量
- 增加 UI 複雜度（需要檔案 icon、點擊行為）
- 混淆使用者意圖（「這個檔案點了能幹嘛？」）

### D7: 互動方式 — double-click + context menu

| 操作 | 行為 |
|------|------|
| 單擊目錄 | 展開/收合子目錄 |
| Double-click 目錄 | 在該 cwd 開新 tab（呼叫 `createNewTab({ cwd })`） |
| 右鍵目錄 | Context menu: 「Open in New Tab」 |
| 單擊 Recent item | 展開/收合（如果是 tree 中的） |
| Double-click Recent item | 在該 cwd 開新 tab |

Context menu 使用簡單的自建 component（absolute positioned div），不引入第三方 menu library。

### D8: Recents 存 localStorage

```typescript
// localStorage key: 'cc-office:recent-cwds'
// 結構：
type RecentCwd = { path: string; lastUsed: number };
// 最多保留 10 筆，按 lastUsed 降序排列
```

**寫入時機：** 使用者透過 Explorer 開新 tab 時（不記錄 server 自動建立的 session）。

**Hook：** `useRecentCwds()` — 回傳 `{ recents, addRecent }`，內部讀寫 localStorage。

### D9: Activity Bar icon 設計

MVP 只有一個 icon（File Explorer），但結構支援多個：

```typescript
interface ActivityBarItem {
  id: string;       // 'explorer' | 'search' | 'history' | ...
  icon: ReactNode;  // SVG or emoji
  title: string;    // tooltip
}
```

- 選中的 icon 高亮（左邊加 accent border 或背景色變化）
- 點擊已選中的 icon → 收合 sidebar（toggle）
- 點擊未選中的 icon → 切換到該 panel + 展開 sidebar

## Risks / Trade-offs

### [Risk] 目錄權限錯誤
使用者瀏覽到沒有讀取權限的目錄，`readdirSync` 會拋錯。
→ **Mitigation:** try-catch，對無權限目錄回傳空 children + 可選的 error indicator。

### [Risk] Symlink 循環
目錄中有 symlink 指向上層，可能造成無限展開。
→ **Mitigation:** Server 端使用 `lstatSync` 檢測 symlink，跳過 symlink 目錄（MVP）。或設定最大深度限制。

### [Risk] Activity Bar 目前只有一個 icon，看起來空
只有一個 📁 icon 的 Activity Bar 可能看起來不完整。
→ **Mitigation:** 可接受。VS Code 新裝也只有幾個 icon。且很快會加 Search / History。

### [Trade-off] 只列目錄 vs 列出檔案
只列目錄讓使用者無法透過檔案內容判斷「這是不是我要的 project」（例如看到 package.json 就知道是 Node 專案）。
→ **Accepted:** MVP 保持簡單。之後可加檔案列表或 project indicator（偵測 package.json、Cargo.toml 等）。

### [Trade-off] 自建 context menu vs 第三方
自建簡單但功能有限（無 submenu、無 keyboard navigation）。
→ **Accepted:** MVP 只需一個 menu item（「Open in New Tab」），自建足夠。之後複雜化再引入 library。
