## 1. ChannelFeature Interface & Registry

- [ ] 1.1 Define `ChannelFeature`, `SlashCommandFeature`, `MenuItemFeature` interfaces in `src/lib/feature.ts`
- [ ] 1.2 Implement feature registry in `src/lib/feature-registry.ts` with `register`, `findSlashCommand` (by match), `getSlashCommand` (by command), `getAll` methods
- [ ] 1.3 Write unit tests for registry: default match, custom match, no match, getAll returns all registered features

## 2. Folder structure + move existing components

- [ ] 2.1 Create `src/features/usage/` — move `AccountUsageDialog.tsx` into it; update all import paths
- [ ] 2.2 Create `src/features/rewind/` — move `RewindDialog.tsx` into it; update all import paths
- [ ] 2.3 Create `src/features/reload-plugins/` and `src/features/compact/` directories

## 3. Migrate sendMessage intercept to registry

- [ ] 3.1 Replace hardcoded `/reload-plugins` check in `ChannelMessagesContext.sendMessage` with `registry.findSlashCommand()`
- [ ] 3.2 Write test: matched feature short-circuits `chat:send`
- [ ] 3.3 Write test: unmatched message reaches CLI normally

## 4. /reload-plugins feature

- [ ] 4.1 Create `src/features/reload-plugins/reload-plugins-feature.ts` — implements `SlashCommandFeature`; `invoke` and `execute` both call `reloadPlugins()` RPC
- [ ] 4.2 Register in `ChannelMessagesProvider`
- [ ] 4.3 Write tests: slash menu calls RPC, ⌘K calls RPC, no `chat:send` emitted

## 5. /usage feature

- [ ] 5.1 Create `src/features/usage/usage-feature.ts` — implements `SlashCommandFeature & MenuItemFeature`; `menuItem: { label: 'Account & usage…', section: 'Model' }`; factory `createUsageFeature({ socket, channelId })`
- [ ] 5.2 `execute` sets `isOpen = true` and emits `settings:refresh_usage`; `invoke` delegates to `execute`
- [ ] 5.3 Create `src/features/usage/use-usage-open.ts` — `useSyncExternalStore` hook
- [ ] 5.4 Update `AccountUsageDialog` to read open state via `useUsageOpen()` hook
- [ ] 5.5 Register in `ChannelMessagesProvider`
- [ ] 5.6 Write tests: slash menu opens dialog, ⌘K opens dialog, close resets isOpen

## 6. /rewind feature

- [ ] 6.1 Create `src/features/rewind/rewind-feature.ts` — implements `MenuItemFeature`; `menuItem: { label: 'Rewind', section: 'Context' }`; no `invoke`
- [ ] 6.2 `execute` sets `isOpen = true`
- [ ] 6.3 Create `src/features/rewind/use-rewind-open.ts` — `useSyncExternalStore` hook
- [ ] 6.4 Update `RewindDialog` to read open state via `useRewindOpen()` hook
- [ ] 6.5 Register in feature registry
- [ ] 6.6 Write tests: ⌘K opens dialog, close resets isOpen

## 7. /compact feature

- [ ] 7.1 Create `src/features/compact/compact-feature.ts` — implements `SlashCommandFeature`; `match` accepts `/compact` with optional arguments; `invoke` calls `chat:send(message)`; no `execute`
- [ ] 7.2 Register in `ChannelMessagesProvider`
- [ ] 7.3 Write tests: `/compact` sends to CLI, `/compact 50` sends with argument

## 8. ⌘K menu driven by registry

- [ ] 8.1 Update `command-menu-items.tsx` to read `SlashCommandFeature` instances from registry → auto-generate Slash Commands section entries calling `feature.execute()`
- [ ] 8.2 Update `command-menu-items.tsx` to read `MenuItemFeature` instances from registry → auto-generate entries in their declared sections calling `feature.execute()`
- [ ] 8.3 Remove `callbacks.onReloadPlugins`, `callbacks.onOpenAccountUsage`, `callbacks.onRewind` from `ComposeToolbarCallbacks` and all call sites
- [ ] 8.4 Write tests: registry-driven menu items appear in correct sections

## 9. Slash menu sort order

- [ ] 9.1 Sort slash commands alphabetically by `command` in the slash menu render
- [ ] 9.2 Write test: commands appear in alphabetical order

## 10. executeSlashCommand routing

- [ ] 10.1 Update `executeSlashCommand` in `ChannelComposeContext` to call `feature.execute()` directly if defined, skip `sendMessage`
- [ ] 10.2 Write tests: feature with `execute` skips `sendMessage`; feature without falls through

## 11. Cleanup

- [ ] 11.1 Remove `activeDialog` union members for `usage` and `rewind` from `ComposeToolbar`; remove `setActiveDialog` if no remaining usages
- [ ] 11.2 Confirm all existing tests pass; update import paths in test files affected by component moves

## 12. switch-model feature

- [ ] 12.1 Create `src/features/switch-model/switch-model-feature.ts` — `MenuItemFeature`; `menuItem: { label: 'Switch model', section: 'Model' }`; `execute` sets signal open
- [ ] 12.2 Create `src/features/switch-model/switch-model-signal.ts` — boolean open signal
- [ ] 12.3 Update `ComposeToolbar` to read signal → open model picker panel reactively; remove `onOpenModelPicker` callback from `CommandMenu`
- [ ] 12.4 Register feature in provider
- [ ] 12.5 Write tests: ⌘K "Switch model" appears in model section; clicking triggers signal

## 14. clear feature ✅

- [x] 14.1 Create `src/features/clear/clear-feature.ts` — `MenuItemFeature`; `execute` calls `clearMessages() + clearModifiedFiles() + sendMessage('/clear')`
- [x] 14.2 Register feature in provider
- [x] 14.3 Remove hardcoded `clear-conversation` item from `command-menu-items.tsx`
- [x] 14.4 Write tests

## 18. new-conversation feature

- [ ] 18.1 Create `src/features/new-conversation/new-conversation-feature.ts` — `MenuItemFeature`; `menuItem: { label: 'New conversation', section: 'Context', filterOnly: true }`; `execute` calls `sendMessage('/new')`
- [ ] 18.2 Register in `ChannelMessagesContext` (inject `sendMessage`)
- [ ] 18.3 Remove hardcoded `new-conversation` item from `command-menu-items.tsx`
- [ ] 18.4 Write tests: ⌘K "New conversation" appears in context section (filterOnly); clicking calls sendMessage('/new') + closes menu

## 15. mention-file feature

- [ ] 15.1 Create `src/features/mention-file/mention-file-feature.ts` — `MenuItemFeature`; `menuItem: { label: 'Mention file from this project...', section: 'Context' }`; `execute` calls `mentionFile()`
- [ ] 15.2 Register in `CommandMenu` (inject `compose.mentionFile`)
- [ ] 15.3 Remove hardcoded `mention-file` item from `command-menu-items.tsx`
- [ ] 15.4 Write tests: ⌘K "Mention file" appears in context section; clicking calls mentionFile + closes menu

## 16. attach-file feature

- [ ] 16.1 Create `src/features/attach-file/attach-file-feature.ts` — `MenuItemFeature`; `menuItem: { label: 'Attach file…', section: 'Context' }`; `execute` calls `onAttachFile()`
- [ ] 16.2 Register in `CommandMenu` (inject `callbacks.onAttachFile`)
- [ ] 16.3 Remove hardcoded `attach-file` item from `command-menu-items.tsx`
- [ ] 16.4 Write tests: ⌘K "Attach file" appears in context section; clicking calls onAttachFile + closes menu

## 17. mcp / plugins features

- [ ] 17.1 Create `src/features/mcp-status/mcp-status-feature.ts`
- [ ] 17.2 Create `src/features/mcp-servers/mcp-servers-feature.ts`
- [ ] 17.3 Create `src/features/manage-plugins/manage-plugins-feature.ts`
- [ ] 17.4 Register all three in `CommandMenu`
- [ ] 17.5 Remove hardcoded customize items from `command-menu-items.tsx`
- [ ] 17.6 Write tests

## 19. general-config feature

- [ ] 19.1 Create `src/features/general-config/general-config-signal.ts` — boolean open signal
- [ ] 19.2 Create `src/features/general-config/general-config-feature.ts` — `MenuItemFeature`; `menuItem: { label: 'General config…', section: 'Settings', closeSilent: true }`; `execute` sets signal open
- [ ] 19.3 Update `ToolbarDialogs` to read signal → render initOptions dialog reactively; remove `initOptions` from `ActiveDialog` union
- [ ] 19.4 Register feature in `ComposeToolbar`; remove `onOpenConfig` callback from `CommandMenu`
- [ ] 19.5 Write tests

## 20. switch-account feature

- [ ] 20.1 Create `src/features/switch-account/switch-account-signal.ts` — boolean open signal
- [ ] 20.2 Create `src/features/switch-account/switch-account-feature.ts` — `MenuItemFeature`; `menuItem: { label: 'Switch account', section: 'Settings', closeSilent: true }`; `execute` sets signal open
- [ ] 20.3 Update `ToolbarDialogs` to read signal → render auth dialog reactively; remove `auth` from `ActiveDialog` union
- [ ] 20.4 Register feature in `ComposeToolbar`; remove `onSwitchAccount` callback from `CommandMenu`
- [ ] 20.5 Write tests

## 21. view-help feature

- [ ] 21.1 Create `src/features/view-help/view-help-feature.ts` — `MenuItemFeature`; `menuItem: { label: 'View help docs', section: 'Support', closeSilent: true }`; factory `createViewHelpFeature({ docsUrl })`; `execute` calls `openUrl(docsUrl)`
- [ ] 21.2 Register feature in `ComposeToolbar` (inject `providerConfig?.brand.docsUrl`)
- [ ] 21.3 Remove `onOpenHelp` callback from `CommandMenu`; remove Settings/Support hardcode from `command-menu-items.tsx`
- [ ] 21.4 Write tests

## 13. resume feature

- [ ] 13.1 Create `src/features/resume/resume-feature.ts` — `MenuItemFeature`; `menuItem: { label: 'Resume conversation…', section: 'Context' }`; `execute` sets signal open
- [ ] 13.2 Create `src/features/resume/resume-signal.ts` — boolean open signal
- [ ] 13.3 Update `ChatPanel` to read signal → open resume overlay reactively; remove `onResumeConversation` prop chain
- [ ] 13.4 Register feature in provider
- [ ] 13.5 Write tests: ⌘K "Resume conversation" appears in context section; clicking triggers signal

## 22. Inline single-consumer use*Open hooks

- [ ] 22.1 Inline `useUsageOpen` into `ToolbarDialogs.tsx` — replace hook call with `useSyncExternalStore(...)` direct; delete `use-usage-open.ts`
- [ ] 22.2 Inline `useRewindOpen` into `ToolbarDialogs.tsx` — replace hook call with `useSyncExternalStore(...)` direct; delete `use-rewind-open.ts`
- [ ] 22.3 Inline `useModelOpen` into `ComposeToolbar.tsx` — replace hook call with `useSyncExternalStore(...)` direct; delete `use-model-open.ts`
- [ ] 22.4 Inline `useResumeOpen` into `ChatPanel.tsx` — replace hook call with `useSyncExternalStore(...)` direct; delete `use-resume-open.ts`
- [ ] 22.5 Confirm all tests pass after each deletion

## 23. command-menu-items: extract repeated section pattern

- [ ] 23.1 Extract `filter → sort → map` repeated pattern (Context/Customize/Settings/Support) into a shared `buildSection()` helper inside `buildMenuItems`
- [ ] 23.2 Confirm existing tests pass (no expect changes)

## 24. 補整合測試（FakeClaude / renderWithWorkspace）

- [ ] 24.1 `clear` — 驗 execute 後 `/clear` 送到 CLI（chat:send emitted）
- [ ] 24.2 `new-conversation` — 驗 execute 後 `/new` 送到 CLI
- [ ] 24.3 `attach-file` — 驗點擊 ⌘K "Attach file…" 觸發 onAttachFile callback
- [ ] 24.4 `manage-plugins` — 驗點擊 ⌘K "Manage plugins" 開啟 plugins dialog
- [ ] 24.5 `resume` — 驗點擊 ⌘K "Resume conversation…" 設定 resumeOpenSignal
- [ ] 24.6 `switch-account` — 驗點擊 ⌘K "Switch account" 設定 switchAccountSignal
- [ ] 24.7 `general-config` — 驗點擊 ⌘K "General config…" 設定 generalConfigSignal
