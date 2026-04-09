# Design: Extract Add-Project Flow

## Current State

```
renderWithWorkspace():
  1. render(SocketProvider > SessionProvider > PluginProvider > ProjectProvider > WorkspaceLayout)
  2. click empty-add-project → AddProjectDialog opens
  3. browse FileTree → select folder → click Open
  4. project created → EditorArea renders → click "New tab"
  5. await session:init → return { claude, channelId, user }

renderWithChannel(ui):
  render(SocketProvider > SessionProvider > PluginProvider > ChannelProvider > ui)
  → 缺 ProjectProvider、TabProvider 由 production 的 WorkspaceLayout 內部管理
```

## Target State

```
// Reusable helper
async function addProject(user, summoner, opts?): Promise<string>
  1. setup filesystem (setRoots, addDirectory)
  2. click empty-add-project OR sidebar "+" button (視 projects.length)
  3. browse FileTree → select → Open
  4. click "New tab" → await session:init
  5. return channelId

// Simplified renderWithWorkspace
renderWithWorkspace():
  render providers + WorkspaceLayout
  channelId = await addProject(user, summoner)
  return { claude, channelId, user, addProject }
```

## Key Decisions

1. **`addProject` 是 UI-level function**：不直接呼叫 `projectActions.addProject()`，而是透過 AddProjectDialog UI 操作
2. **兩個 UI 入口**：
   - 無 project 時：`empty-add-project` button（EmptyState）
   - 有 project 時：sidebar ProjectList 的 "+" button
3. **`renderWithChannel` 暫不改動**：它服務的是 channel 級 component 測試（不需要 project 層），改動影響 18 個 test files，風險太大。未來需要時再評估
4. **`addProject` 回傳 channelId**：因為加 project 後需要等 session init 完成才能操作
