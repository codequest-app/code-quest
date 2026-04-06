## Context

Tab 建立流程有三種路徑（createNewTab、session:created broadcast、syncFromServer），各自使用不同的 key 策略（client UUID vs channelId）。ChannelProvider 用 `channelId === undefined` 判斷 launch vs join mode，導致 launch 時 render null（空白 tab）。onChange callback 需要回傳 channelId 給 WorkspaceLayout 做橋接。這些問題的根因都是 **tabKey 和 channelId 分離**。

## Goals / Non-Goals

**Goals:**
- 統一 tabKey === channelId，client 在 createNewTab 時預生成 channelId
- 消除 `setChannelId` 橋接步驟
- 簡化 `syncFromServer` 的雙重 matching 邏輯
- 消除 ChannelProvider 的 `return null` 分支（launch mode 不再有 channelId 未定義）
- onChange 從 `{ channelId?, title?, status? }` 簡化為 `{ title?, status? }`

**Non-Goals:**
- Server 端 session 管理不改動（server 已支援 client 帶 channelId launch）
- Tab 排序、tab 持久化等 UI 行為不在範圍內

## Decisions

### Decision 1: Client 預生成 channelId，tabKey === channelId

createNewTab 直接生成 channelId 作為 tabKey。session:launch 帶上這個 channelId 讓 server 採用。

**統一的 addTab 函式：**

```typescript
function addTab(id: string) {
  setState(prev => {
    if (id in prev.tabs) return prev; // 冪等
    return {
      ...prev,
      tabs: { ...prev.tabs, [id]: DEFAULT_META },
      activeTabId: prev.activeTabId ?? id,
    };
  });
}
```

三種情境統一呼叫 addTab：
- **New Tab**: `createNewTab({ cwd })` → 內部 `channelId = UUID` + `setState` 帶 cwd
- **session:created**: `addTab(channelId)` — server broadcast，不帶 cwd
- **syncFromServer**: 直接 key lookup，不帶 cwd

**替代方案**：保持 tabKey/channelId 分離 → 拒絕，因為是所有後續問題的根因。

### Decision 2: ChannelProvider 用 cwd prop 判斷 launch vs join

channelId 永遠有值。launch/join 用 cwd prop 區分：
- `cwd` 有值 → launch（emit session:launch 帶 channelId + cwd）
- `cwd` 為 undefined → join（直接 session:join）

**cwd 只在 createNewTab 時存入 TabMeta**。onCreated 和 syncFromServer 不存 cwd — server 回傳的 cwd 不放進 TabMeta，因為 join 不需要。

WorkspaceLayout 傳 `cwd={tabs[id]?.cwd}` — 有就 launch，undefined 就 join。

launch 完成後不需要清 cwd — useEffect deps `[channelId, cwd, socket]` 不變就不會重跑。

ChannelProvider 用 `launched` state 控制渲染：
- `useState(!cwd)` — cwd 有值時初始 false（需等 launch），cwd 無值時初始 true（直接 join）
- launch 完成後 `setLaunched(true)` → 渲染完整子樹
- `!launched` 時渲染 loading indicator（"Connecting…"），不是 null
- Strict Mode 安全：cleanup 只設 cancelled flag，不送 session:close（避免假 close+dead）
- Session cleanup 由 WorkspaceLayout.handleCloseTab 負責

### Decision 3: onChange 移除 channelId 職責

Client 已知 channelId，不需要 server 回傳。onChange 簡化為 `{ title?, status? }`。

WorkspaceLayout 的 onChange handler 刪除 `if (update.channelId) setChannelId(...)` 分支。`setChannelId` action 從 TabContext 移除。

### Decision 4: syncFromServer 簡化為單一 key lookup

```typescript
syncFromServer(sessions) {
  setState(prev => {
    const next: Record<string, TabMeta> = {};
    for (const s of sessions) {
      next[s.channelId] = prev.tabs[s.channelId] ?? { ...DEFAULT_META };
    }
    const activeTabId = prev.activeTabId && prev.activeTabId in next
      ? prev.activeTabId
      : sessions[0]?.channelId ?? null;
    return { tabs: next, activeTabId };
  });
}
```

不再需要 `meta.channelId && serverIds.has(meta.channelId)` 的雙重 matching。TabMeta 不需要 `channelId` 欄位 — key 本身就是 channelId。

### Decision 5: TabMeta 結構簡化

```typescript
interface TabMeta {
  title?: string;
  tabStatus: 'default' | 'pending' | 'done';
  cwd?: string;          // 只在 createNewTab 時有值（launch 信號）
}
```

移除 `channelId` 欄位 — tabKey 就是 channelId，不需要冗餘存一份。

## Risks / Trade-offs

- **[Risk] Client UUID 碰撞** → UUID v4 碰撞率 < 10^-37，可忽略
- **[Risk] session:launch 帶 client channelId，server 必須採用** → Server 已支援 `parsed.channelId ?? crypto.randomUUID()`，無需改動
- **[Risk] launch useEffect 在 join 場景重跑** → 不會。join 場景 cwd 為 undefined，effect 條件 `if (!cwd) return` 直接跳過
- **[Trade-off] addTab 的冪等設計依賴 channelId 唯一性** → UUID v4 保證
