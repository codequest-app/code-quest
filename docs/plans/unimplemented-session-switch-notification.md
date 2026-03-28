# Unimplemented: Server-Pushed Session Switch Notification

## 用途

當 server 主動建立新 session（例如 fork、teleport、remote control 接管），
需要通知使用者「有新 session 可以切換」，並在畫面上彈出 toast，
讓使用者可以一鍵切換到該 session。

## 原本的設計

- `useChatStore` 有 `newSessionNotification` 狀態與 `setNewSessionNotification` setter
- `HeaderBar` 監聽這個狀態，彈出帶有 Switch 按鈕的 toast
- 使用者點 Switch → 呼叫 `onSwitchSession(sessionId)` 切換 session

## 為何移除

- `setNewSessionNotification` 從來沒有任何地方呼叫，功能完全沒有接通
- `onSwitchSession` prop 讓 ChatPanel / HeaderBar 承擔了不屬於它們的責任
- server 通知屬於全局事件，不應該放在聊天 UI 層處理

## 未來實作建議

實作位置應在 **WorkspaceLayout**，而非 ChatPanel 或 HeaderBar：

```
socket.on('session:notification', ({ message, sessionId, severity }) => {
  toast[severity](message, {
    action: sessionId
      ? { label: 'Switch', onClick: () => resumeSession(sessionId) }
      : undefined,
  });
});
```

需要確認的事項：
- server 用哪個 socket event 推送通知（目前尚未定義）
- 哪些情境會觸發（fork、teleport、remote control 接管？）
- 是否需要同時開新 tab，還是取代當前 tab
