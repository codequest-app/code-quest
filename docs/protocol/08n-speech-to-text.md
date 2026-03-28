### 7.17 Speech-to-Text 完整生命週期

**方向**：WebView → Extension → VSCode Speech Extension → WebView

**用途**：整合 VSCode 語音輸入擴展（`ms-vscode.vscode-speech`），提供語音轉文字功能。

**前置條件**：
- 環境變數 `CLAUDE_SPEECH_TO_TEXT` 必須為 `"true"`（第 71224 行）
- 需安裝 `ms-vscode.vscode-speech` 擴展

---

#### 7.17.1 啟動流程（start_speech_to_text）

**位置**：第 71227–71258 行

```
WebView ──(start_speech_to_text { channelId })──→ Extension
  ↓
檢查 speechToTextChannels Map 中是否已有該 channel
  ├── 已存在 → 拋出錯誤
  └── 不存在 → 繼續
  ↓
createSpeechToTextStream()（第 68662–68735 行）：
  ├── 取得 ms-vscode.vscode-speech 擴展（若未啟動則 activate）
  ├── 開啟暫時的空白文字文件（preview 模式）
  ├── 註冊 onDidChangeTextDocument 監聽器
  ├── 執行 VSCode 命令：workbench.action.editorDictation.start
  └── 回傳 { iterator: asyncGenerator, abort: abortFunction }
  ↓
將 { abort } 存入 speechToTextChannels Map
  ↓
啟動 async 迴圈，逐段串流轉錄文字：
  for await (let text of iterator)
    send({ type: "speech_to_text_message", channelId, text, done: false })
  ↓
串流結束 → closeSpeechToTextChannel(channelId, true)
```

---

#### 7.17.2 內部轉錄機制

**位置**：第 71277–71350 行（`createSpeechToTextStream`）

```
VSCode Dictation 啟動
  ↓
語音辨識結果寫入暫時文件
  ↓
onDidChangeTextDocument 監聽器觸發
  ├── 比較新舊文字內容
  ├── 若不同 → 將完整文字推入 queue 陣列
  └── 喚醒等待中的 async generator
  ↓
async generator yield queue 中的文字
  ↓
Extension 將文字作為 speech_to_text_message 發送至 WebView
```

**等待機制**：generator 以 100ms 為間隔輪詢 queue，有新文字時立即 yield。

---

#### 7.17.3 停止流程（stop_speech_to_text）

**位置**：第 71260–71271 行

```
WebView ──(stop_speech_to_text { channelId })──→ Extension
  ↓
從 speechToTextChannels 取得 abort controller
  ↓
呼叫 abort()：
  ├── 設定 aborted flag = true → generator 停止迴圈
  ├── 執行 VSCode 命令：workbench.action.editorDictation.stop
  ├── dispose 文件變更監聽器
  └── 關閉暫時文件：workbench.action.revertAndCloseActiveEditor
  ↓
generator 結束 → closeSpeechToTextChannel 清理
```

---

#### 7.17.4 清理（closeSpeechToTextChannel）

**位置**：第 71272–71275 行

```javascript
closeSpeechToTextChannel(channelId, shouldClose, error) {
  if (shouldClose)
    send({ type: "close_channel", channelId, error });  // 通知 WebView
  speechToTextChannels.delete(channelId);                // 清理 Map
}
```

---

#### 7.17.5 訊息格式

**串流中**（Extension → WebView）：

```json
{
  "type": "speech_to_text_message",
  "channelId": "頻道 ID",
  "text": "目前辨識到的完整文字",
  "done": false
}
```

**結束/錯誤**（Extension → WebView）：

```json
{
  "type": "close_channel",
  "channelId": "頻道 ID",
  "error": "錯誤訊息（可選）"
}
```

> **注意**：每次推送的 `text` 是到目前為止的**完整文字**（非增量），因為 VSCode Dictation 會覆寫整個文件內容。
