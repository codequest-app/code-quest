## 1. TabContext split state (TDD)
- [x] Add `splitTabId` + `enterSplit / exitSplit` actions; preserve through addTab/createNewTab/replaceTab; auto-clear on removeTab.

## 2. TabContainer split rendering
- [x] When `splitTabId` set, render PanelGroup with two `<SplitHalf>` halves; each wraps `<TabContent>` with its own ChannelProvider.
- [x] Active half has border-accent. `×` button on each half exits split.

## 3. TabBar trigger
- [x] Shift+click (or Alt+click) a tab → `onSplitTab(sessionId)` instead of select.

## 4. Verify + commit
- [x] client tsc + vitest green; biome clean.

## Out of scope (defer)
- LiveSessionPopover Split → cross-project requires NavigationContext intent (TabProvider is per-project).
- Cmd+\ keyboard shortcut.
- Mobile/tablet split disable.
