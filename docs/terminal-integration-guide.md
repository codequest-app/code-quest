# Web Terminal 整合指南

完整的 xterm.js + node-pty + Socket.io 整合文件

## 系統架構

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  React Component                                     │   │
│  │  ┌──────────────┐     ┌─────────────────────────┐  │   │
│  │  │ TerminalTabs │────▶│ Terminal (xterm.js)     │  │   │
│  │  │              │     │ - 顯示終端畫面           │  │   │
│  │  │ - Tab 管理   │     │ - 接收使用者輸入         │  │   │
│  │  │ - Socket 連線│     │ - 渲染 ANSI 輸出        │  │   │
│  │  └──────────────┘     └─────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                 │
│                            │ Socket.io Events                │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
                    WebSocket Connection
                             │
┌────────────────────────────┼─────────────────────────────────┐
│                      Node.js Server                          │
│                            │                                 │
│  ┌─────────────────────────▼─────────────────────────────┐  │
│  │  Socket.io Handler                                     │  │
│  │  - 處理 terminal:create, write, resize, kill         │  │
│  │  - 事件路由                                           │  │
│  └─────────────────────────┬─────────────────────────────┘  │
│                            │                                 │
│  ┌─────────────────────────▼─────────────────────────────┐  │
│  │  Terminal Manager                                      │  │
│  │  - 管理多個 PTY sessions                              │  │
│  │  - Session 生命週期管理                               │  │
│  └─────────────────────────┬─────────────────────────────┘  │
│                            │                                 │
│  ┌─────────────────────────▼─────────────────────────────┐  │
│  │  node-pty (PTY Process)                                │  │
│  │  - spawn shell (bash/zsh/powershell)                  │  │
│  │  - 處理 I/O                                           │  │
│  │  - 調整大小                                           │  │
│  └─────────────────────────┬─────────────────────────────┘  │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
                    ┌────────▼─────────┐
                    │  Shell Process   │
                    │  (bash/zsh/etc)  │
                    └──────────────────┘
```

## 資料流向

### 1. 使用者輸入流程

```
使用者按鍵
    │
    ▼
xterm.js (onData event)
    │
    ▼
Socket.io emit('terminal:write', sessionId, data)
    │
    ▼
Server receives event
    │
    ▼
TerminalManager.write(sessionId, data)
    │
    ▼
ptyProcess.write(data)
    │
    ▼
Shell 接收輸入並處理
```

### 2. 終端輸出流程

```
Shell 產生輸出
    │
    ▼
ptyProcess.onData((data) => ...)
    │
    ▼
Socket.io emit('terminal:data', sessionId, data)
    │
    ▼
Client receives event
    │
    ▼
terminal.write(data)
    │
    ▼
xterm.js 渲染到螢幕
```

### 3. 終端調整大小流程

```
視窗大小改變
    │
    ▼
FitAddon.fit()
    │
    ▼
terminal.onResize((cols, rows) => ...)
    │
    ▼
Socket.io emit('terminal:resize', sessionId, cols, rows)
    │
    ▼
Server receives event
    │
    ▼
ptyProcess.resize(cols, rows)
    │
    ▼
Shell 接收新的終端尺寸
```

## Socket.io 事件協議

### Client → Server Events

```typescript
interface ClientToServerEvents {
  // 建立新終端
  'terminal:create': (options?: {
    shell?: string;
    cwd?: string;
    cols?: number;
    rows?: number;
  }) => void;

  // 寫入資料到終端
  'terminal:write': (sessionId: string, data: string) => void;

  // 調整終端大小
  'terminal:resize': (sessionId: string, cols: number, rows: number) => void;

  // 終止終端
  'terminal:kill': (sessionId: string) => void;

  // 列出所有終端
  'terminal:list': () => void;
}
```

### Server → Client Events

```typescript
interface ServerToClientEvents {
  // 終端建立完成
  'terminal:created': (sessionId: string, pid: number) => void;

  // 終端輸出資料
  'terminal:data': (sessionId: string, data: string) => void;

  // 終端程序退出
  'terminal:exit': (sessionId: string, exitCode: number) => void;

  // 終端列表
  'terminal:list': (sessionIds: string[]) => void;

  // 錯誤訊息
  'terminal:error': (message: string) => void;
}
```

## 實作檢查清單

### 後端實作

- [ ] 安裝 `node-pty@1.2.0-beta.10`（支援 Node.js 23+）
- [ ] 建立 TerminalManager 類別
  - [ ] `createSession()` - 建立新 PTY
  - [ ] `getSession()` - 取得 session
  - [ ] `write()` - 寫入資料
  - [ ] `resize()` - 調整大小
  - [ ] `kill()` - 終止 session
  - [ ] `cleanup()` - 清理所有 sessions
- [ ] 設定 Socket.io Handler
  - [ ] 監聽 `terminal:create`
  - [ ] 監聽 `terminal:write`
  - [ ] 監聽 `terminal:resize`
  - [ ] 監聽 `terminal:kill`
  - [ ] 設定 `ptyProcess.onData()` 轉發到 socket
  - [ ] 設定 `ptyProcess.onExit()` 通知客戶端
- [ ] 錯誤處理
  - [ ] PTY spawn 失敗處理
  - [ ] Session 不存在處理
  - [ ] Socket 斷線清理

### 前端實作

- [ ] 安裝 `@xterm/xterm`, `@xterm/addon-fit`, `@xterm/addon-web-links`
- [ ] 載入 xterm.css
- [ ] 建立 useSocket Hook
  - [ ] Socket.io 連線管理
  - [ ] `on()` 事件監聽
  - [ ] `emit()` 事件發送
  - [ ] 連線狀態追蹤
  - [ ] 錯誤處理
- [ ] 建立 Terminal 元件
  - [ ] 建立 xterm.js 實例
  - [ ] 載入 FitAddon
  - [ ] 載入 WebLinksAddon
  - [ ] `terminal.open()` 到 DOM
  - [ ] `terminal.onData()` 監聽輸入
  - [ ] `terminal.onResize()` 監聽調整大小
  - [ ] 監聽 `terminal:data` 事件
  - [ ] ResizeObserver 處理容器大小變化
  - [ ] 清理函式（dispose）
- [ ] 建立 TerminalTabs 元件
  - [ ] Tab 列表管理
  - [ ] 新增/關閉 tab
  - [ ] 切換 active tab
  - [ ] 鍵盤快捷鍵（Ctrl+T, Ctrl+W）
  - [ ] 連線狀態顯示
  - [ ] 錯誤訊息顯示
- [ ] 狀態管理（Zustand）
  - [ ] Sessions map
  - [ ] Active session ID
  - [ ] Socket 連線狀態
  - [ ] 新增/移除/設定 active session

### CSS 樣式

- [ ] 確保容器有明確尺寸
```css
.terminal-container {
  width: 100%;
  height: 100%;
  min-height: 400px;
}
```

- [ ] 父容器使用 flexbox
```css
.terminal-tabs {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.terminal-content {
  flex: 1;
  overflow: hidden;
}
```

## React StrictMode 處理

React 18+ StrictMode 會讓 useEffect 執行兩次，需要特別處理：

### 問題

```typescript
// ❌ 錯誤：會建立兩個終端實例
useEffect(() => {
  const terminal = new Terminal();
  terminal.open(container);
  return () => terminal.dispose();
}, []);
```

### 解決方案 1：檢查是否已初始化

```typescript
// ✅ 正確
useEffect(() => {
  if (terminalRef.current) return; // 避免重複建立

  const terminal = new Terminal();
  terminalRef.current = terminal;
  terminal.open(container);

  return () => {
    terminal.dispose();
    terminalRef.current = null;
  };
}, []);
```

### 解決方案 2：使用 cleanup 標記

```typescript
// ✅ 正確
useEffect(() => {
  let didCleanup = false;

  const terminal = new Terminal();

  if (!didCleanup) {
    terminal.open(container);
  }

  return () => {
    didCleanup = true;
    terminal.dispose();
  };
}, []);
```

## 常見問題排除

### 1. 終端建立成功但畫面空白

檢查項目：
- [ ] CSS 是否載入？ `import '@xterm/xterm/css/xterm.css'`
- [ ] 容器是否有尺寸？檢查 DevTools 的 Elements
- [ ] 是否呼叫 `terminal.open()`？
- [ ] 是否有資料寫入？檢查 `terminal:data` 事件

除錯方法：
```javascript
// 測試寫入
terminal.write('Test output\r\n');

// 檢查 DOM
console.log(containerRef.current.children.length); // 應該 > 0
```

### 2. 收不到 terminal:data 事件

檢查項目：
- [ ] Socket 是否連線？`socket.connected`
- [ ] 事件監聽器是否正確設定？
- [ ] Session ID 是否匹配？
- [ ] 伺服器是否有送資料？檢查伺服器 log

除錯方法：
```javascript
// 客戶端
socket.on('terminal:data', (id, data) => {
  console.log('Received data for session:', id, data.substring(0, 50));
});

// 伺服器端
ptyProcess.onData((data) => {
  console.log('Sending data:', data.substring(0, 50));
  socket.emit('terminal:data', sessionId, data);
});
```

### 3. FitAddon 錯誤

錯誤：`Cannot read properties of undefined (reading 'dimensions')`

原因：
- 容器沒有尺寸
- 在 `open()` 之前呼叫 `fit()`

解決：
```javascript
terminal.open(container);

// 使用 RAF 延遲 fit
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    fitAddon.fit();
  });
});
```

### 4. node-pty spawn 失敗

錯誤：`posix_spawnp failed`

可能原因：
- Shell 路徑錯誤
- Node.js 版本不符（需要 beta 版本支援 Node 23+）
- 工作目錄不存在

解決：
```javascript
// 使用絕對路徑
const shell = process.env.SHELL || '/bin/bash';

// 確保目錄存在
const cwd = process.env.HOME || process.cwd();

// 升級到 beta 版本
pnpm add node-pty@1.2.0-beta.10
```

## 效能最佳化

### 1. 批次傳送資料

```javascript
let buffer = '';
const FLUSH_INTERVAL = 16; // ~60 FPS

ptyProcess.onData((data) => {
  buffer += data;
});

setInterval(() => {
  if (buffer) {
    socket.emit('terminal:data', sessionId, buffer);
    buffer = '';
  }
}, FLUSH_INTERVAL);
```

### 2. 使用 ResizeObserver

比 window.resize 更精確：

```javascript
const resizeObserver = new ResizeObserver(() => {
  try {
    fitAddon.fit();
  } catch (e) {
    // 忽略快速調整時的錯誤
  }
});

resizeObserver.observe(container);
```

### 3. 限制並發 sessions

```javascript
const MAX_SESSIONS = 10;

if (sessions.size >= MAX_SESSIONS) {
  socket.emit('terminal:error', 'Maximum sessions reached');
  return;
}
```

## 安全考量

### 1. 驗證 Session 擁有權

```typescript
// 追蹤 session 所有者
const sessionOwners = new Map<string, string>(); // sessionId -> socketId

socket.on('terminal:write', (sessionId, data) => {
  if (sessionOwners.get(sessionId) !== socket.id) {
    socket.emit('terminal:error', 'Unauthorized');
    return;
  }

  terminalManager.write(sessionId, data);
});
```

### 2. 限制可執行的 Shell

```typescript
const ALLOWED_SHELLS = [
  '/bin/bash',
  '/bin/zsh',
  '/bin/sh'
];

if (!ALLOWED_SHELLS.includes(shell)) {
  throw new Error('Shell not allowed');
}
```

### 3. 使用容器隔離

建議在 Docker 容器中執行，限制權限。

### 4. 輸入驗證

```typescript
socket.on('terminal:write', (sessionId, data) => {
  // 限制資料長度
  if (data.length > 10000) {
    return;
  }

  terminalManager.write(sessionId, data);
});
```

## 測試策略

### 單元測試

- Mock node-pty
- Mock Socket.io
- 測試 TerminalManager 邏輯
- 測試 React 元件渲染

### 整合測試

- 測試 Socket.io 事件流
- 測試實際 PTY spawn
- 測試資料傳輸

### E2E 測試

- 使用 Playwright/Cypress
- 測試完整使用者流程
- 測試多個並發終端

## 相關資源

### 官方文件
- [xterm.js Documentation](https://xtermjs.org/docs/)
- [node-pty GitHub](https://github.com/microsoft/node-pty)
- [Socket.io Documentation](https://socket.io/docs/)

### 範例專案
- [How to Create Web-Based Terminals](https://saisandeepvaddi.com/blog/how-to-create-web-based-terminals)
- [xterm.js Examples](https://github.com/xtermjs/xterm.js/tree/master/demo)

### Skills
- `.claude/skills/xterm-integration/` - xterm.js 整合指南
- `.claude/skills/node-pty-usage/` - node-pty 使用指南

## 授權

MIT License
