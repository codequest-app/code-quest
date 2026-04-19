---
name: extension-ui-reference
description: >
  Reference guide for comparing cc-office UI against the real Claude Code VS Code Extension via live MCP debugmcp inspection. Use when building or redesigning UI components, aligning visuals with the extension, creating OpenSpec changes for UI alignment, or unsure what the extension renders for a given element.
---

# Extension UI Reference — Live Inspection with MCP

## Extension Folder

```
/Users/user/Desktop/anthropic.claude-code-2.1.45-darwin-arm64/
├── src/
│   ├── core/main.js   ← 核心邏輯（~70k 行，可讀性高，首選）
│   ├── core/runtime.js ← esbuild helper
│   ├── modules/        ← 第三方 npm 模組（210 個）
│   └── module-map.json ← 模組索引
├── extension.js        ← bundled（94k 行，備案，不優先讀）
├── webview/index.js    ← webview React app (compiled)
└── .vscode/
    └── launch.json     ← "Run Extension" debug config
```

**讀程式碼時以 `src/core/main.js` 為主，`extension.js` 為備案。**
`src/core/main.js` 經過 webcrack + prettier + normalize，class/method 名保留，可讀性遠高於 bundled extension.js。

## Step 1: Launch Extension in Debug Mode

Use MCP debugmcp `start_debugging` to launch the extension:

```
tool: start_debugging
fileFullPath: /Users/user/Desktop/anthropic.claude-code-2.1.45-darwin-arm64/extension.js
workingDirectory: /Users/user/Desktop/anthropic.claude-code-2.1.45-darwin-arm64
configurationName: Run Extension
```

This opens a new VS Code Extension Development Host window with the Claude Code UI.

## Step 2: Inspect the Live UI

### Option A — VS Code Developer Tools (visual inspection)
In the Extension Development Host window:
1. **Help → Toggle Developer Tools** (opens Chromium DevTools)
2. Use **Element Inspector** to click any UI element and see its CSS classes and computed styles
3. Look for class patterns like `camelCase_randomHash` (e.g., `menuPopup_pZbgXw`, `fileItem_pZbgXw`)
4. Check the **Styles** panel for actual computed CSS values

### Option B — evaluate_expression (programmatic)
After `start_debugging`, use `evaluate_expression` to query the extension host context.

To inspect webview content (if accessible from extension host):
```javascript
// Get computed styles of a specific element
getComputedStyle(document.querySelector('.menuPopup_pZbgXw'))
```

## Step 3: Map Extension CSS → cc-office Design Tokens

| Extension CSS Variable | cc-office Token / Class |
|---|---|
| `--app-menu-background` | `bg-surface` |
| `--app-input-border` | `border-border` |
| `--app-primary-foreground` | `text-text` |
| `--app-secondary-foreground` | `text-text-muted` |
| `--app-list-active-background` | `hover:bg-white/5` |
| `--corner-radius-large` (8px) | `rounded-lg` |
| `--app-list-border-radius` (4px) | `rounded` |
| `--app-list-item-padding` (4px 8px) | `py-1 px-2` |
| `--app-monospace-font-family` | `font-mono` |

## Step 4: Implement in cc-office

After inspecting the live UI:
1. Map extension layout → Tailwind classes using the token table above
2. For custom effects (animations, scrollbars) → add as `@utility` in `App.css`
3. **Never install packages** — `scrollbar-thin`, `fadeIn`, `slideUp` already defined in `App.css`

## Key UI Patterns (from live inspection)

### @ Mention File Picker
Trigger by typing `@` in the Claude input box and observe in DevTools:
- Container: `position:absolute; bottom:100%; left:0; right:0` inside input wrapper
- Background: surface color, 1px border, 8px border-radius
- Max height: ~300px, `overflow-y:auto`
- Animation: `fadeIn 0.15s ease-out`
- File items: flex row — icon (20×20, opacity 0.6) + monospace path text

### Slash Action Menu
Trigger by typing `/` in the input:
- Same popup container style as @ mention
- Filter input at top separated by `border-bottom`
- Sections with small uppercase headers: Context / Model / Customize / Slash Commands

### Input Footer
Observe the bottom bar:
- `display:flex; align-items:center; gap:6px; padding:5px`
- Left: permission mode label | context % usage
- Right: model name | attach 📎 | / menu | send ↑

## Scrollbar

Already defined in `App.css` — no package needed:
```
className="overflow-y-auto scrollbar-thin"
```
