## 1. Server: onExit reset processing

- [ ] 1.1 channel.ts — onExit 時如果 _isProcessing=true，合成 message:result(isError=true) 送給 client
- [ ] 1.2 channel.ts — onExit 呼叫 endProcessing()
- [ ] 1.3 測試：process exit during processing → client 收到 error result

## 2. Client: cancelling timeout

- [ ] 2.1 abort() 設定 15s timeout
- [ ] 2.2 timeout 到 → status=idle + error message
- [ ] 2.3 message:result 先到 → 清 timeout
- [ ] 2.4 測試：cancel → timeout → idle + error
- [ ] 2.5 測試：cancel → result 先到 → 正常 idle

## 3. session:closed 清 status

- [ ] 3.1 確認 session:closed handler 清除 processing/cancelling
- [ ] 3.2 測試

## 4. 驗證

- [ ] 4.1 全部 tests green
