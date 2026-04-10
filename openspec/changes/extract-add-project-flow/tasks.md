## Tasks

- [x] 1. 從 renderWithWorkspace 抽出 `addProject` 和 `launchSession` 為獨立 function
- [x] 2. renderWithWorkspace 預設呼叫 addProject + launchSession（向下相容）
- [x] 3. addProject 回傳 `{ launchSession }` 描述真實兩步流程
- [x] 4. renderWithWorkspace 不再預設 addProject — 只 render providers + WorkspaceLayout
- [x] 5. 逐檔遷移 caller：addProject + launchSession 移到 beforeEach 或 test 內
- [x] 6. EditorArea 無 tab 時顯示 empty state（"No open sessions" + "New Session" button）
- [x] 7. launchSession 偵測兩個入口：TabBar "+" 或 empty state "New Session" button
