# Spec: cwd 統一 — launch 時 resolve 一次

## 需求

所有 handler 的工作目錄統一使用 `ch.workspaceFolder`，不再從各 handler 的 payload 取 cwd。
client 只在 `session:launch` 時傳入 cwd，server resolve 成絕對路徑後存到 channel。

## 設計

```
session:launch { cwd: '../' }
  → server: ch.workspaceFolder = path.resolve(cwd)  // 絕對路徑
  → CLI spawn 用 ch.workspaceFolder

file:list { pattern }      → cwd = ch.workspaceFolder ?? process.cwd()
file:read { filePath }     → cwd = ch.workspaceFolder ?? process.cwd()
git:status {}              → cwd = ch.workspaceFolder ?? process.cwd()
git:checkout { branch }    → cwd = ch.workspaceFolder ?? process.cwd()
git:log { limit }          → cwd = ch.workspaceFolder ?? process.cwd()
git:diff {}                → cwd = ch.workspaceFolder ?? process.cwd()
```

## 變更

### server session/connect.ts
- session:launch 從 payload 取 cwd，`path.resolve(cwd)` 設到 ch.workspaceFolder
- CLI spawn 使用 ch.workspaceFolder

### server file.ts
- handleList / handleRead 移除 payload cwd 取值，統一 ch.workspaceFolder

### server git.ts
- 所有 handler 移除 payload cwd 取值，統一 ch.workspaceFolder

### shared schema
- git schema 移除 cwd 欄位
- socket-events.ts git:status / git:diff 恢復為只有 callback（不帶 payload）

### client
- GitContext 不再帶 cwd
- searchFiles / file:read 不再帶 cwd
- session:launch 帶 cwd: workspaceFolder

## 驗收條件
- [ ] session:launch 帶 cwd → ch.workspaceFolder 為絕對路徑
- [ ] file:list / file:read 使用 ch.workspaceFolder
- [ ] git handler 使用 ch.workspaceFolder
- [ ] client 只在 launch 時傳 cwd
- [ ] 相對路徑正確 resolve 為絕對路徑
