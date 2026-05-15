## ADDED Requirements

- 新增 `components/ui/GroupHeader.tsx`，渲染 `section-label px-1 pt-2 pb-1 first:pt-0`
- 接受 `className`、`children`
- 不接受 `as` prop — 固定渲染為 `<div>`
- 取代以下地方的 inline 定義：
  - `components/project/ProjectList.tsx` — group header div（重複 2 處）
  - `components/project/ProjectTree.tsx` — 內聯 `GroupHeader` function
  - `components/settings/InstalledPluginList.tsx` — 內聯 `SectionHeader` function
