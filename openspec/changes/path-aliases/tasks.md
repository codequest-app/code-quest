## 1. Client path alias

- [x] 1.1 tsconfig.json: 加 baseUrl + paths `@/*` → `src/*`
- [x] 1.2 vite.config.ts: 加 tsconfigPaths plugin
- [x] 1.3 vitest.config.ts: 加 tsconfigPaths plugin（vitest 用獨立 config）
- [x] 1.4 批量替換 `../../../` import → `@/`（production + test + stories）
- [x] 1.5 Run tests green (1381)

## 2. Vitest 版本統一

- [x] 2.1 統一所有 package.json vitest 為 `^1.6.1`
- [x] 2.2 pnpm install
- [x] 2.3 Run tests green

## 3. TypeScript target 統一

- [x] 3.1 client tsconfig.json: target ES2021 → ES2022, lib ES2022
- [x] 3.2 Run tests green

## 4. Commit + push

- [x] 4.1 Run all tests green (1381)
- [ ] 4.2 Commit + push

## 5. Code review 修正

- [x] 5.1 提取 Payload type alias → guard.ts export，9 個檔案改 import
- [x] 5.2 提取 addMessage helper → guard.ts，message.ts + system.ts 改 import
- [x] 5.3 移除 ChannelConfigContext + ChannelControlContext 殘留 Payload 重複
- [x] 5.4 Run tests green (1381)
- [x] 5.5 Commit + push

## 6. Dead code 移除

- [x] 6.1 types/ui.ts: 移除 MessageOf<T>（唯一真正 dead）
- [x] 6.2 GitContext/useCwd/FileViewer/MCPPanel 等 → 保留（有 stories + tests，預留元件）
- [x] 6.3 Run tests green

## 7. 重複 pattern → useClickOutside hook

- [x] 7.1 建立 hooks/useClickOutside.ts
- [x] 7.2 替換 AddButton outside-click
- [x] 7.3 替換 MessageActions outside-click
- [x] 7.4 替換 PermissionModePicker outside-click
- [x] 7.5 替換 ComposeInput outside-click
- [x] 7.6 替換 ComposeToolbar outside-click
- [x] 7.7 CommandMenu 保留（用 click 非 mousedown，語義不同）
- [x] 7.8 Run tests green

## 8. 過度設計清理 + code smell

- [x] 8.1 navigate-items.ts → inline 到 CommandMenu（單 consumer，無 test）
- [x] 8.2 file.ts toBase64 → inline 到 ComposeContext（單 consumer）
- [x] 8.3 open-url.ts → 保留（security boundary，2 consumers）
- [x] 8.4 CollapsibleTimeline → 保留（需 user toggle，非純 derived）
- [x] 8.5 ComposeToolbar: 200000 → DEFAULT_CONTEXT_WINDOW
- [x] 8.6 Run tests green

## 9. session:launch 職責搬移 TabContext → ChannelProvider

- [ ] 9.1 createNewTab: 移除 socket.emit + initialPrompt，只管 tab state，同步 return channelId
- [ ] 9.2 ChannelProvider: 將 cwd prop 傳給 ChannelMessagesContext
- [ ] 9.3 ChannelMessagesContext: cwd 有值 → session:launch { channelId, cwd }，cwd 沒值 → session:join { channelId }
- [ ] 9.4 launch callback 後接 session:join 取得 init state
- [ ] 9.5 TabMeta: 移除 needsLaunch
- [ ] 9.6 Run tests green
- [ ] 9.7 Commit + push
