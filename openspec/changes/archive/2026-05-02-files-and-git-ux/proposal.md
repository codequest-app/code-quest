## Why

FilesPane 無法瀏覽隱藏資料夾（如 `.env`、`.claude`），導致使用者需要切換到其他工具才能查看。GitPane 的 diff 點擊對 staged 和 untracked 檔案無效，使 git 工作流程斷裂。兩個問題都直接影響日常使用體驗。

## What Changes

- FilesPane 右上角新增「顯示隱藏」toggle（eye icon），預設關閉
- `fs:browse` socket event 加入 `showHidden: boolean` 參數
- filesystem service 根據 flag 決定是否過濾 dot entries（`.git` 永遠排除）
- `git.diff` socket event 改為接受 `{ cwd, filePath, status }`，per-file per-status
- GitPane 點擊檔案時傳入 filePath + status，server 端依狀態選擇正確 git 命令
- untracked（`??`）檔案顯示為全新增的偽 diff

## Capabilities

### New Capabilities

（無新增 capability，皆為現有功能的修正與擴充）

### Modified Capabilities

- `files-pane`: 新增 showHidden toggle UI 與行為
- `filesystem-service`: `readBrowseEntries` 支援 `showHidden` flag，`.git` 移入永久忽略清單
- `git-pane`: `openDiff` 改為 per-file per-status，UI 傳遞 status 給 server
- `summoner-git-architecture`: `diff(cwd)` 介面改為 `diff(cwd, filePath, status)`

## Impact

- `packages/summoner/src/filesystem/local.ts` — readBrowseEntries 過濾邏輯
- `packages/summoner/src/git/commands.ts` — diff 命令邏輯
- `packages/summoner/src/git/types.ts` — GitService interface
- `packages/server/src/socket/handlers/git.ts` — git.diff handler
- `packages/shared/src/socket-events.ts` — fs:browse / git.diff payload 型別
- `packages/client/src/components/files/FilesPane.tsx` — showHidden toggle
- `packages/client/src/components/git/GitPane.tsx` — openDiff 呼叫方式
