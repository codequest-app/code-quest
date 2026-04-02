## 規則

- TDD：FakeClaude + real JSON + testing-library
- 每步改完跑 test，expect 不變或等價
- named function（不用 arrow）
- 小步前進，一次只改一件事

## 1. cwd 統一：launch 時 resolve 一次，handler 統一用 ch.workspaceFolder

### 1.1 session:launch 帶 cwd + resolve
- [ ] test(RED)：session:launch 帶 cwd → ch.workspaceFolder 為絕對路徑
- [ ] connect.ts：從 payload 取 cwd，`path.resolve(cwd)` 存到 ch.workspaceFolder
- [ ] CLI spawn 用 ch.workspaceFolder 作為工作目錄
- [ ] 400 server test pass

### 1.2 file handler 改用 ch.workspaceFolder
- [ ] handleList：移除 payload cwd 取值，統一用 `ch.workspaceFolder ?? process.cwd()`
- [ ] handleRead：同上
- [ ] 400 server test pass

### 1.3 git handler 移除 payload cwd
- [ ] handleStatus / handleCheckout / handleLog / handleDiff：移除 payload cwd，改用 ch.workspaceFolder
- [ ] 更新 git test（expect 不變或等價）
- [ ] 400 server test pass

### 1.4 shared schema 清理
- [ ] git schema 移除 cwd 欄位（gitStatusSchema, gitDiffSchema 等）
- [ ] fileListSchema / fileReadPayloadSchema 移除 cwd 欄位（如果有）
- [ ] socket-events.ts：git:status / git:diff 移除 payload 參數（改回只有 callback）
- [ ] 全量 test pass

### 1.5 client 移除 cwd 傳遞
- [ ] GitContext：git:status / git:checkout / git:log / git:diff 不再帶 cwd
- [ ] ComposeInput searchFiles 不再帶 cwd
- [ ] file:read 不再帶 cwd
- [ ] session:launch 帶 cwd: workspaceFolder
- [ ] 622 client test pass

## 2. MentionDropdown 改版

### 2.1 SVG icons
- [ ] 建立 FileIcon / FolderIcon / TerminalIcon（從 extension 提取 SVG path）
- [ ] Storybook story

### 2.2 排版改版
- [ ] test(RED)：file result → icon + name + directory path 分開
- [ ] test(RED)：directory result → icon + full path
- [ ] test(RED)：terminal result → icon + name + "terminal" label
- [ ] MentionDropdown component 改版
- [ ] 622 client test pass

### 2.3 交互改善
- [ ] test(RED)：hover 改 active index
- [ ] onMouseEnter → setSelectedIndex
- [ ] scrollIntoView on active change
- [ ] Tab 進入目錄（append path + `/`）
- [ ] 622 client test pass

## 3. AddButton 改版

### 3.1 icon + label
- [ ] 建立 UploadIcon / AddContextIcon（從 extension 提取 SVG path）
- [ ] label "Files & Folders" → "Add context"

### 3.2 dismiss 行為
- [ ] test(RED)：Esc 關閉 dropdown
- [ ] test(RED)：click outside 關閉 dropdown
- [ ] useEffect + document.addEventListener（keydown Esc + mousedown outside）
- [ ] 622 client test pass

## 驗證

- [ ] typecheck pass（server + client + summoner）
- [ ] 全量 test pass
- [ ] Storybook 各 story 渲染正確
