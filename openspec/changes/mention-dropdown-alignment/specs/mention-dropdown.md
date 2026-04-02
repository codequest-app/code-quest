# Spec: MentionDropdown

## 需求

MentionDropdown 對齊 extension UI，每個 file type 有專屬 SVG icon，排版分 name + path。

## 行為

### file 項目
- 顯示 FileIcon (20x20 SVG) + name + directory path（灰色）
- directory path 只有當 path 長度 > name 長度時才顯示
- directory path = `path.substring(0, path.length - name.length)`

### directory 項目
- 顯示 FolderIcon (20x20 SVG) + full path

### terminal 項目
- 顯示 TerminalIcon (20x20 SVG) + name + "terminal"（灰色 label）

### 交互
- `onMouseEnter` 改變 active index
- active 項目自動 `scrollIntoView({ block: 'nearest' })`
- `Tab` 鍵進入目錄（append path + `/` 繼續搜尋）
- `Enter` 選擇
- `ArrowUp/Down` 移動
- `Escape` 關閉
- highlight match 保留（extension 沒有但我們已有）

## 驗收條件
- [ ] file/folder/terminal 各有正確的 SVG icon
- [ ] file 項目顯示 name + directory path 分開
- [ ] hover 改變 active highlight
- [ ] Tab 進入目錄
- [ ] scrollIntoView on active change
