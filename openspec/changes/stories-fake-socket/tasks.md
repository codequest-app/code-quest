## 1. Story decorator + infrastructure

- [x] 1.1 建立 test/story-decorator.tsx — withStoryChannel + StoryProviders
- [x] 1.2 ChannelMessagesProvider 加回 initialState（for stories）
- [x] 1.3 遷移 ComposeToolbar.stories 為第一個範例
- [x] 1.4 Run tests green

## 2. 遷移所有 stories — 用 withStoryChannel 取代 withChannel + initialState

（每個 story 遷移後用 Playwright 或 Storybook build 驗證）

- [ ] 2.1 ComposeInput.stories.tsx
- [ ] 2.2 HeaderBar.stories.tsx
- [ ] 2.3 MessageList.stories.tsx
- [ ] 2.4 TerminalPanel.stories.tsx
- [ ] 2.5 PendingActionBanner.stories.tsx（用 ChannelControl context）
- [ ] 2.6 AuthDialog.stories.tsx
- [ ] 2.7 ChatPanel.stories.tsx
- [ ] 2.8 CommandMenu.stories.tsx
- [ ] 2.9 ErrorFallback.stories.tsx
- [ ] 2.10 InstalledPluginList.stories.tsx
- [ ] 2.11 ManageMcpDialog.stories.tsx
- [ ] 2.12 McpServerRow.stories.tsx
- [ ] 2.13 PermissionModePicker.stories.tsx
- [ ] 2.14 PlanReviewBanner.stories.tsx
- [ ] 2.15 PluginsPanel.stories.tsx
- [ ] 2.16 ReviewUpsellBanner.stories.tsx
- [ ] 2.17 RewindDialog.stories.tsx
- [ ] 2.18 ToolPermissionBanner.stories.tsx
- [ ] 2.19 UsageBar.stories.tsx
- [ ] 2.20 Playwright 驗證所有 stories 正確渲染

## 3. 移除 initialState from ChannelProvider

- [ ] 3.1 移除 ChannelProvider.initialState prop
- [ ] 3.2 移除 ChannelInitialState type（如無 consumer）
- [ ] 3.3 Run all tests green
- [ ] 3.4 Playwright 驗證

## 4. Commit + push

- [ ] 4.1 Run all tests green
- [ ] 4.2 Commit + push
