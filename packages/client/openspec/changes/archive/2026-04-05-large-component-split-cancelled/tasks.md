## 1. CommandMenu 拆分

- [ ] 1.1 提取 keyboard nav logic → `command-menu-keyboard.ts`
- [ ] 1.2 提取 filter/search logic → `command-menu-filter.ts`
- [ ] 1.3 CommandMenu.tsx 改 import 新模組
- [ ] 1.4 Run tests green

## 2. ManageMcpDialog 拆分

- [ ] 2.1 提取 status helpers → `mcp-status-helpers.ts`
- [ ] 2.2 提取 badge components → `McpStatusBadge.tsx`
- [ ] 2.3 ManageMcpDialog.tsx 改 import
- [ ] 2.4 Run tests green

## 3. ComposeToolbar 拆分

- [ ] 3.1 提取 lazy dialog render → `ComposeDialogs.tsx`
- [ ] 3.2 ComposeToolbar.tsx 改 import
- [ ] 3.3 Run tests green

## 4. ComposeInput 拆分

- [ ] 4.1 提取 mention logic → `use-mention.ts`
- [ ] 4.2 ComposeInput.tsx 改 import
- [ ] 4.3 Run tests green

## 5. Verify + commit

- [ ] 5.1 確認所有拆分後主檔案 < 250 LOC
- [ ] 5.2 Run all tests green
- [ ] 5.3 Commit + push
