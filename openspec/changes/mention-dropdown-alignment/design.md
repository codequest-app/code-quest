# Design: Mention Dropdown Alignment

## 1. file:list / file:read cwd 統一

### 現在
```
client: socket.emit('file:list', { channelId, pattern })
server: cwd = ch.workspaceFolder ?? process.cwd()
```

### 改為
```
client: socket.emit('file:list', { channelId, pattern, cwd: workspaceFolder })
server: cwd = payload.cwd ?? ch.workspaceFolder ?? process.cwd()
```

與 git handler 一致 — client 傳 cwd，server 優先用 payload cwd。

shared schema 更新：
- `fileListSchema` 加 `cwd: z.string().optional()`
- `fileReadPayloadSchema` 加 `cwd: z.string().optional()`

## 2. MentionDropdown 改版

### 排版結構

```
┌────┬─────────────────────────────────────┐
│icon│ name          directory-path (灰色)  │
└────┴─────────────────────────────────────┘
```

**file 項目**：
- 20x20 SVG 文件 icon
- `name`（從 path 取最後一段）
- `path - name`（灰色，只有 path != name 時顯示）

**directory 項目**：
- 20x20 SVG 資料夾 icon
- `path`（完整路徑）

**terminal 項目**：
- 20x20 SVG 終端機 icon
- `name`
- "terminal"（灰色 label）

### SVG Icons

直接從 extension webview/index.js 提取，放在 `components/icons/` 或 inline。
- FileIcon — 文件含裝飾（line 233199-233205）
- FolderIcon — 資料夾有 tab（line 233244-233250）
- TerminalIcon — 終端機 >_（line 233214-233220）

### 交互改善

| 功能 | 實作 |
|---|---|
| hover 改 active | `onMouseEnter` → `setSelectedIndex(i)` |
| scrollIntoView | active 項目 ref + `scrollIntoView({ block: 'nearest' })` |
| Tab 進入目錄 | `onFileSelect(item, isTab)` — Tab 時 append path + `/` 繼續搜尋 |
| keydown 綁 document | 從 textarea keydown 移到 document addEventListener |

## 3. AddButton 改版

### 選項
| id | label | icon | 行為 |
|---|---|---|---|
| upload | Upload from computer | 上傳 SVG | 觸發 file input |
| files | Add context | @ SVG | 插入 `@` 觸發 mention |

### Dismiss 行為
- **Esc**：useEffect + document keydown listener
- **Click outside**：useEffect + document mousedown listener
- 兩者都在 `open` 為 true 時才綁定

## 4. 測試策略

### Server
- `file.test.ts`：`file:list` 帶 cwd → 驗證使用該 cwd
- `file.test.ts`：`file:read` 帶 cwd → 驗證使用該 cwd

### Client
- `MentionDropdown.test.tsx`：render with mock file/folder/terminal results → 驗 icon + 排版
- `AddButton.test.tsx`：Esc dismiss + click outside dismiss
- `ChatPanel.test.tsx`：integration — `@` trigger → file:list → dropdown 渲染
- Storybook：MentionDropdown 各 type story
