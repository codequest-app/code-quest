## 規則

- TDD：FakeClaude + real JSON + testing-library
- 每步改完跑 test，expect 不變或等價
- named function（不用 arrow）
- 小步前進，一次只改一件事

## 1. cwd 統一（已完成）

- [x] session:launch resolve cwd → ch.workspaceFolder
- [x] Channel.workspaceFolder setter auto-resolve + getter fallback process.cwd()
- [x] git/file handlers 統一用 ch.workspaceFolder
- [x] git schema 移除 cwd 欄位
- [x] client GitContext 不再帶 cwd
- [x] TabProvider 帶 workspaceFolder，session:launch 帶 cwd
- [x] mention dropdown click outside dismiss

## 2. MentionDropdown 改版（已完成）

- [x] SVG icons（FileIcon / FolderIcon / TerminalIcon）
- [x] 排版：file name+path 分開、directory full path、terminal name+"terminal"
- [x] hover 改 active、scrollIntoView、onHover callback

## 3. AddButton 改版（已完成）

- [x] icon + label "Add context"
- [x] Esc + click outside dismiss
- [x] menu position left-aligned

## 4. file:list 目錄瀏覽 + fuzzy search（對齊 extension）

### 4.1 安裝依賴（已完成）

- [x] server: glob + fuse.js
- [x] server devDeps: memfs（test 用）

### 4.2 server file handler 改用 glob + fuse.js（已完成）

- [x] file handler 用 glob 取代 listWithWalk + rgListFiles
- [x] 空 pattern → 列根目錄第一層（file + directory）
- [x] pattern 含 `/` → 列該目錄下一層
- [x] pattern 不含 `/` → glob 全部 → fuse.js fuzzy search
- [x] server test pass

### 4.3 client integration test（renderWithChannel + FakeClaude + memfs）

用 renderWithChannel + FakeClaude 走完整 pipeline，memfs fake filesystem。
測 `@` mention 的完整流程：輸入 → file:list → dropdown 渲染 → 交互。

- [x] test(RED)：輸入 `@` → dropdown 顯示根目錄第一層（src/, package.json, README.md）
- [x] test(RED)：輸入 `@src/` → dropdown 顯示 src/ 下一層
- [x] test(RED)：輸入 `@channel` → fuzzy search 顯示 matching files
- [x] test(RED)：click directory → query 更新為 `@path/`，dropdown 不關閉，列表更新
- [x] test(RED)：click file → 插入 `@path`，dropdown 關閉
- [x] test(RED)：Tab on directory → 進入目錄（同 click directory）
- [x] test(RED)：Tab on file → 選取（同 click file）
- [x] test(RED)：Enter → 選取當前項目
- [x] test(RED)：Esc → 關閉 dropdown
- [x] 實作 ComposeInput + MentionDropdown 交互邏輯
- [x] 630+ client test pass

## 驗證

- [x] typecheck pass
- [x] 全量 test pass
