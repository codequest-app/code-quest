# Proposal: Extract Add-Project Flow

## Problem

`renderWithWorkspace` 包含完整的「加 project」UI flow（AddProjectDialog → 選資料夾 → Open → New tab → session init），這段邏輯被硬編碼在 helper 裡無法重用。

目前有兩類 test helper：
- `renderWithWorkspace`：走完整 UI flow，包含 project 層
- `renderWithChannel`：跳過 project 層，直接掛 ChannelProvider

問題：
1. `renderWithChannel` 的 Provider 順序不符合 production（缺 ProjectProvider）
2. 需要測試 project 層級行為的測試無法重用「加 project」邏輯
3. 「加 project」有兩個進入點（UI / event），但測試應統一走 UI flow

## Solution

從 `renderWithWorkspace` 抽出 `addProject` 為獨立 async function，可在任何已 render WorkspaceLayout 的測試中重用。統一所有測試走 UI flow（AddProjectDialog）。

## Scope

- 抽出 `addProject` test helper function
- `renderWithWorkspace` 改用抽出的 `addProject`
- 評估 `renderWithChannel` 是否需要改為走 project flow
