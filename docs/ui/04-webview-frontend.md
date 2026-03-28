# 04 — 前端架構（Webview）

## 檔案結構

| 檔案 | 大小 | 說明 |
|------|------|------|
| `webview/index.js` | ~4.7 MB（2,040 行 minified） | React SPA bundle，以 ES module 載入 |
| `webview/index.css` | ~351 KB（1 行 minified） | 所有樣式，含 Monaco Editor CSS |

---

## 渲染模式

Extension Host 動態產生 HTML 時，透過 `window.*` 全域變數切換三種模式：

```
window.IS_SIDEBAR = true         → 側邊欄緊湊佈局
window.IS_FULL_EDITOR = true     → 全螢幕編輯器佈局
window.IS_SESSION_LIST_ONLY = true → 僅顯示 Session 列表
```

三者皆使用同一套 `webview/index.js` + `webview/index.css`，由前端根據變數決定渲染內容。

---

## HTML 模板結構

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="...嚴格 CSP...">
  <link href="{webview}/index.css" rel="stylesheet">
  <style>
    :root {
      --vscode-editor-font-family: {fontFamily};
      --vscode-editor-font-size: {fontSize}px;
      --vscode-editor-font-weight: {fontWeight};
      --vscode-chat-font-size: {chatFontSize}px;
      --vscode-chat-font-family: {chatFontFamily};
    }
  </style>
</head>
<body>
  <pre id="claude-error"></pre>
  <div id="root"></div>
  <script nonce="{nonce}">
    window.initialConfiguration = { initialPrompt, initialSession }
    window.IS_SIDEBAR = true/false
    window.IS_FULL_EDITOR = true/false
    window.IS_SESSION_LIST_ONLY = true/false
  </script>
  <script nonce="{nonce}" src="{webview}/index.js" type="module"></script>
</body>
</html>
```

**安全性**：
- 嚴格 CSP：nonce-based script、禁止外部網路存取（無 `https:` in CSP）
- 每次載入產生新的 nonce

---

## 打包套件

| 套件 | 出現次數（約） | 用途 |
|------|---------------|------|
| **React** + **ReactDOM** | 核心框架 | SPA 框架，使用 `createRoot` 掛載於 `#root` |
| **Monaco Editor** | ~699 | 程式碼編輯器 / 語法高亮 / Diff 顯示元件 |
| **marked** | ~10 | Markdown → HTML 渲染 |
| **remark** | ~7 | Markdown 處理 pipeline |
| **rehype** | ~1 | HTML 處理 pipeline（配合 remark） |
| **emotion** | ~1 | CSS-in-JS 樣式方案 |

> **未使用**：Tailwind CSS、Radix UI、Shadcn、Lucide Icons 等常見元件庫。

前端使用 **Web Worker** 執行 Monaco Editor 的語言服務（語法高亮、自動完成等），避免阻塞主線程。

---

## CSS 設計系統

### 自訂 CSS 變數（`--app-*`）

Webview 定義了 ~78 個 `--app-*` 自訂 CSS 變數，作為 VS Code 原生 `--vscode-*` 變數的抽象層：

| 分類 | 範例 |
|------|------|
| 品牌色彩 | `--app-claude-orange: #d97757`、`--app-claude-ivory: #faf9f5`、`--app-claude-slate: #141413` |
| 間距 | `--app-spacing-small: 4px` ~ `--app-spacing-xlarge: 16px` |
| 圓角 | `--corner-radius-small: 4px` ~ `--corner-radius-large: 8px` |
| 字型 | `--app-monospace-font-family`、`--app-monospace-font-size` |
| 主色 | `--app-primary-foreground`、`--app-primary-background` → 映射至 `--vscode-foreground`、`--vscode-sideBar-background` |
| 輸入框 | `--app-input-foreground`、`--app-input-background`、`--app-input-border` |
| 列表 | `--app-list-hover-background`、`--app-list-active-background` |
| 選單 | `--app-menu-background`、`--app-menu-selection-background` |
| 進度條 | `--app-progressbar-background`、`--app-progressbar-border` |
| Diff | `--app-diff-addition-foreground`、`--app-diff-deletion-foreground` |
| 狀態 | `--app-status-busy`、`--app-status-pending` |
| Banner | `--app-banner-tint` |

### VS Code CSS 變數使用量

CSS 中引用了 **237 個** 不同的 `--vscode-*` 變數，確保與 VS Code 主題完全整合。

### 圖示

使用 **65 個** VS Code Codicon 圖示（`codicon-*` class），透過 `@font-face` 載入 Codicon 字型。
