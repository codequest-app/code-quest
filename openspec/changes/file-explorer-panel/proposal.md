## Why

目前 cc-office 的 Claude session 只能在 server process 啟動的目錄下工作。使用者無法選擇不同的 working directory 來開新 session，這在實際使用中極不合理——一台機器上通常有多個 project，使用者需要能自由切換工作目錄。

需要一個常駐的 File Explorer panel，讓使用者瀏覽目錄結構、選定目標目錄後在該 cwd 開啟新的 Claude session tab。

## What Changes

### 新增全域 Layout 結構（VS Code 風格）
- 新增 **Activity Bar**（左側 icon 列，~40px），用於切換左側 panel
- 新增 **Left Sidebar**（resizable），承載 File Explorer 等全域 panel
- **TabBar** 從全寬改為只在右側 editor 區域上方
- 現有 right side panel（RawEventPanel）維持 per-tab 不變

```
┌──┬─────────────┬─────────────────────────────────────┐
│  │             │ [Tab1] [Tab2] [+]                    │
│  │  Sidebar    ├─────────────────────────────────────┤
│A │  (resizable)│                                     │
│c │             │  ChatPanel                           │
│t │  File       │  ┌─ main ────────┐ ┌─ right ──────┐│
│i │  Explorer   │  │ HeaderBar     │ │ RawEvent     ││
│v │  Panel      │  │ MessageList   │ │ Panel        ││
│i │             │  │ ChatInput     │ │              ││
│t │             │  └───────────────┘ └──────────────┘│
│y │             │                                     │
└──┴─────────────┴─────────────────────────────────────┘
```

### 新增 File Explorer Panel
- **目錄樹瀏覽**：lazy load，點擊展開/收合，只列目錄不列檔案（MVP）
- **開啟新 tab**：double-click 目錄或右鍵 context menu → 在該 cwd 開新 tab
- **Recents 區塊**：底部顯示最近使用過的 cwd，存 localStorage
- **安全限制**：可透過環境變數 `FILE_EXPLORER_ROOTS` 限制可瀏覽的根目錄

### 新增 Server 端全域目錄瀏覽 API
- 新增 `explorer:browse` socket event（不綁 channel），可列出任意目錄的子目錄
- Server 端 path validation：檢查目標路徑是否在 allowed roots 底下
- 從 `config.ts` 讀取 `FILE_EXPLORER_ROOTS` 環境變數

## Capabilities

### New Capabilities
- `file-explorer`: File Explorer panel 的完整功能——目錄瀏覽、cwd 選擇、recents、安全限制
- `workspace-layout`: VS Code 風格的全域 layout 結構——Activity Bar、resizable left sidebar、panel 切換機制

### Modified Capabilities
- `client`: 架構新增 Activity Bar + Left Sidebar 層級，WorkspaceLayout 從扁平結構改為三欄式

## Impact

### Server
- **新增 handler**：`explorer.ts` — `explorer:browse` event，不經過 `withChannel`
- **新增 config**：`FILE_EXPLORER_ROOTS` 環境變數，server config 新增 `explorerRoots` 欄位
- **新增 shared schema**：`explorerBrowsePayloadSchema`、`explorerBrowseResponseSchema`

### Client
- **重構 WorkspaceLayout**：從 `TabBar + ChatPanel` 改為 `ActivityBar + Sidebar + (TabBar + ChatPanel)`
- **新增 component**：`ActivityBar`、`SidebarContainer`（resizable）、`FileExplorerPanel`、`DirectoryTree`
- **新增 context/store**：sidebar 狀態管理（active panel、width）
- **新增 hook**：`useExplorerBrowse`（socket RPC）、`useRecentCwds`（localStorage）

### Shared
- 新增 zod schemas for explorer events
- 新增 socket event type definitions

### Dependencies
- `react-resizable-panels` v4.6.2（已安裝）— resizable sidebar
- `@headless-tree/core` + `@headless-tree/react`（新增）— headless tree component with async lazy load
