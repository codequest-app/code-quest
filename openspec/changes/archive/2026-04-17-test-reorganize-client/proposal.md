## Why

Client 測試檔案中有幾個大型測試檔案將多個不相關的主題混放，導致測試失敗難以定位、新增測試時不知道放哪裡。用資料夾結構重組可以讓每個測試檔案只關注單一主題。

## What Changes

- 將 `config-from-session.test.tsx` 拆成 `config-from-session/` 資料夾下的 4 個檔案
- 將 `TabContext.test.tsx` 拆成 `TabContext/` 資料夾下的 3 個檔案
- 將 `MCPPanel.test.tsx` 拆成 `MCPPanel/` 資料夾下的 4 個檔案
- 純搬移：不改任何 expect、不改任何測試邏輯

## Capabilities

### New Capabilities
- `client-test-organization`: 以資料夾組織 client 測試，每個檔案單一主題

### Modified Capabilities

## Impact

- `apps/web/src/contexts/channel/__tests__/`
- `apps/web/src/contexts/__tests__/`
- `apps/web/src/components/__tests__/`
