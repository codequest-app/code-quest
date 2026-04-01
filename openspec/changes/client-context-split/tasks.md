## 規則

- Handler 使用 named function（不用 arrow），map 在底部集中宣告
- Effects 也使用 named function
- socket.on/off handler 使用 named function（不用 inline arrow）
- 每步 615 test pass

## 1. ChannelMessagesContext on handlers

- [x] 1.1 新建 `handlers/messagesHandlers.ts`，21 個純 state handler（named function）
- [x] 1.7 typecheck + 615 test pass

## 2. ChannelMessagesContext auto-wiring（state handlers）

- [x] 2.1-2.6 auto-wiring loop + 特殊 events 個別保留

## 3. ChannelMessagesContext emit actions

- [x] 3.1-3.6 createMessagesActions（17 個 named function）

## 4. ChannelControlContext on + emit handlers

- [x] 4.1-4.5 controlHandlers.ts + auto-wiring

## 5. ChannelConfigContext on + emit handlers

- [x] 5.1-5.5 configHandlers.ts + auto-wiring

## 6. ChannelComposeContext on handler

- [x] 6.1-6.3 composeHandlers.ts + auto-wiring

## 7. Handler 檔案搬到 handlers/ 目錄

- [x] 7.1-7.3 handlers/ 目錄 + import 更新

## 8. Side-effect events 搬到 messagesEffects

- [x] 8.1 messagesHandlers.ts 新增 `messagesEffects` map（7 個 named function）
- [x] 8.2 auto-wiring loop 同時接 messagesHandlers + messagesEffects
- [x] 8.3 移除 context 裡的 side-effect useEffect 區塊
- [x] 8.4 guard 移到所有 useEffect 內部（解決 biome exhaustive-deps）
- [x] 8.5 resetStreamingRefs 用 useCallback 包裝
- [x] 8.6 MutableRefObject → RefObject
- [x] 8.7 typecheck + 615 test pass

## 9. 其他 context biome exhaustive-deps 修正

- [x] 9.1 ChannelControlContext：guard 移到各 useEffect 內部
- [x] 9.2 ChannelConfigContext：guard 移到 auto-wiring useEffect 內部
- [x] 9.3 ChannelComposeContext：無問題（guard 已在 useEffect 內）
- [x] 9.4 typecheck + 615 test pass

## 10. 待辦：named function 整理

- [x] 10.1 messagesEffects 內的 handler 確認都是 named function
- [x] 10.2 context 裡殘留的 socket.on handler 改為 named function（Messages 5個 + Control 4個）
- [x] 10.3 615 test pass

## 11. 清理

- [x] 11.1 Contexts 合計 1,801→1,123 行（-38%），handlers 911 行
- [x] 11.2 615 test pass
