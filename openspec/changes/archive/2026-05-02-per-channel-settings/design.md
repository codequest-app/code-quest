## Design: Per-Channel Settings (Model & Permission Mode)

### 核心原則

**改當前 channel，寫 DB 當預設，不影響其他 channel。新 session 啟動讀 DB。**

---

### Server 端改動

#### 1. `handleSetModel` (settings.ts:68-78)

現在：
```
emit set_model to CLI → settingsStore.set(provider, 'model') → broadcastModels()
```

改為：
```
emit set_model to CLI → ch.updateSessionConfig({ model }) → settingsStore.set(provider, 'model')
→ emit(channelId, EVENTS.settings.update, { modelSetting: model })  // 只通知當前 channel
```

- 移除 `broadcastModels()` 中對 model 選擇的廣播（available models list 的廣播保留）
- 改用 `emitter.emit(channelId, ...)` 取代 `emitter.broadcastAll(...)`

#### 2. `handleSetPermissionMode` (settings.ts:80-89)

現在：
```
emit set_permission_mode to CLI → ch.updateSessionConfig() → settingsStore.set()
→ broadcastAll(EVENTS.settings.update, { initialPermissionMode })
```

改為：
```
emit set_permission_mode to CLI → ch.updateSessionConfig({ permissionMode })
→ settingsStore.set(provider, 'permissionMode')
→ emit(channelId, EVENTS.settings.update, { initialPermissionMode })  // 只通知當前 channel
```

#### 3. `broadcastSessionState` (channel-manager.ts:259-284)

現在會對所有 channel 廣播 settings.update，改為：
- `session:states` 仍保留（session list 需要顯示各 channel 的 model/mode）
- 移除裡面對 `EVENTS.settings.update` 的 broadcastAll，各 channel 的 settings 靠自己的事件

#### 4. Channel 啟動時套用 DB 預設

在 channel 建立/join 後、CLI session init 時：
- 從 `settingsStore.getMany(provider, ['model', 'permissionMode'])` 讀預設
- 作為 `sessionConfig` 的初始值
- 若 CLI session:init 回傳的值存在，以 CLI 回傳為準（覆蓋 DB 預設）

---

### Client 端改動

#### 5. `ChannelConfigContext` Effect 3 (line 169-192) — SessionContext 同步

現在：從 `sessions` 陣列找到匹配的 session，把 `modelSetting`/`permissionMode` 同步回 local state。

問題：這會導致其他 channel 的 broadcastSessionState 覆蓋當前 channel 的值。

改為：
- 只在**初始化時**（`model === null` 時）從 SessionContext 同步
- 或者完全移除此同步，改為只依賴 `settings:update` 事件（因為現在 settings:update 已經是 per-channel）

#### 6. `onSettingsUpdate` (settings.ts:70-90)

不需改動 — 它已經是接收 `EVENTS.settings.update` 後更新 local state，只要 server 端改成 per-channel emit，client 端自然只收到自己 channel 的更新。

#### 7. `setModel` / `setPermissionMode` (settings.ts:206-217)

加入 optimistic update：
```typescript
setModel(model) {
  deps.setState?.((prev) => ({ ...prev, model }));  // optimistic
  deps.emit(EVENTS.settings.set_model, { model }, (res) => {
    if (res.error) {
      deps.setState?.((prev) => ({ ...prev, model: prev.model }));  // rollback
    }
  });
}
```

---

### 資料流圖

```
使用者在 Channel A 改 model:

  Client A                    Server                     Client B
  ────────                    ──────                     ────────
  setModel("opus")
    → optimistic update
    → emit settings:set_model ──→ handleSetModel
                                    ├─ CLI set_model
                                    ├─ ch.updateSessionConfig
                                    ├─ settingsStore.set (DB)
                                    └─ emit(chA, settings:update)
                              ←────── { modelSetting: "opus" }
    ← onSettingsUpdate                                   (不收到)
    ← state.model = "opus"

  之後開 Channel D:

  Client D                    Server
  ────────                    ──────
  emit app:init ────────────→ handleInit
                                ├─ settingsStore.getMany → { model: "opus" }
                              ←── { settings: { model: "opus" } }
    ← state.model = "opus"
```
