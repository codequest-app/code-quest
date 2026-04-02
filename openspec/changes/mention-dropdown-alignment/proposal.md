# Mention Dropdown Alignment

## Problem

`@` mention 列表和 `+` 按鈕 UI 與 extension 有明顯差距：
- MentionDropdown 沒有 SVG icon，用文字 "/"、"term" 代替
- 排版全路徑一行，沒有分 name + directory path
- AddButton dropdown 無 icon、label 不對、無 Esc/click-outside dismiss
- `file:list` 和 `file:read` 的 cwd 不由 client 傳入，與 git handler 不一致

## Solution

1. **MentionDropdown** — 對齊 extension：SVG icon（file/folder/terminal）、排版分 name + path、hover 改 active、scrollIntoView、Tab 進入目錄
2. **AddButton** — 加 icon、改 label "Add context"、修 Esc + click outside dismiss
3. **file:list / file:read** — client 傳 `cwd: workspaceFolder`，server 優先用 payload cwd

## Scope

### In scope
- MentionDropdown component 改版
- AddButton component 改版
- file handler（server）接受 cwd from payload
- shared schema 更新（file:list, file:read 加 cwd）

### Out of scope
- Browse the web 功能
- browser type 支援
- File manager 功能

## Affected packages
- `packages/client` — MentionDropdown, AddButton, ComposeInput
- `packages/server` — handlers/file.ts
- `packages/shared` — schemas/file.ts, socket-events.ts
