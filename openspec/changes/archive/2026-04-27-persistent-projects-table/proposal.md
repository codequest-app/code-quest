## Why

Project 目前是 **derived from active sessions**（`ProjectContext.tsx:51-59`），不是 persistent entity。這造成多個無法解決的 gap：

- 沒 active session 的 project 看不到（重新整理就消失）
- 無法存 metadata（自訂名稱、pinned、color、lastOpenedAt）
- Recent / Pinned 排序做不到
- Project 不能「先建好等之後再用」（必須先開 session 才會出現）
- Top scope switcher（F direction 的核心）缺資料來源

這是 cc-office UI 演進的第一塊地基 — 後續所有 worktree-scoped panels（Files / Git / Spec / Terminal）和 multi-project 功能（live sessions overview、project switcher）都依賴 persistent project entity。

## What Changes

**Server**
- 新增 `projects` table（drizzle schema for SQLite + MySQL）
- 新增 `ProjectStore` service（純 persistence: CRUD + upsert by path，**不認識 filesystem**）
- 在 `FilesystemService` 介面新增 `exists(path)` 方法 — `projects:add` handler 用它做 fail-fast 驗證
- Session 建立時 → upsert project + 更新 `lastOpenedAt`
- Session 刪除時 → 不動 project（保留 metadata）
- 新增 socket events：`projects:list` / `projects:add` / `projects:update` / `projects:remove`
- Drizzle migration（SQLite + MySQL 對應）

**Client**
- `ProjectContext` 從 derived 改為 server-backed（透過新 socket events）
- 保留現有 ProjectContext 對外介面（`projects` / `addProject` / `setActiveProject`），讓 UI 元件不用改
- 內部從「sessions 衍生」改為「服器同步 + 樂觀更新」
- 新增 `addProject(path)` 流程：呼叫 server upsert，回應後更新 context

**不影響的東西**
- 現有 UI 元件（ProjectList, ProjectCard, AddProjectDialog）介面不變
- WorkspaceLayout 結構不變
- Session 行為不變
- 既有 sessions 的 `projectRoot` 欄位仍存在

## Capabilities

### New Capabilities
- `persistent-projects`: Projects 變一等公民實體，可獨立 CRUD、有 metadata、跨 session 持久化

### Modified Capabilities
- `project-workspace`: ProjectContext 改為 server-backed，內部資料來源從 sessions 衍生改為 socket events

## Impact

**新增檔案**
- `apps/server/src/db/schema-sqlite.ts` — 加 `projects` table
- `apps/server/src/db/schema-mysql.ts` — 加 `projects` table
- `apps/server/drizzle/sqlite/0001_projects.sql`（generated migration）
- `apps/server/drizzle/mysql/0001_projects.sql`（generated migration）
- `apps/server/src/services/project-store.ts`（新）
- `apps/server/src/services/__tests__/project-store.test.ts`（新）
- `apps/server/src/socket/handlers/projects.ts`（新）
- `apps/server/src/__tests__/projects.test.ts`（新 — handler integration）
- `packages/shared/src/projects/schemas.ts`（新 — Zod schemas + EVENTS）
- `packages/shared/src/projects/index.ts`（新 — re-exports）

**修改檔案**
- `apps/summoner/src/filesystem/types.ts` — `FilesystemService` 加 `exists` method
- `apps/summoner/src/filesystem/local.ts` — 實作 `exists`
- `apps/summoner/src/test/fake-filesystem.ts`（如有）— 加 `exists` mock
- `apps/server/src/socket/handlers/session/connect.ts` — session.create 時 upsert project
- `apps/server/src/container.ts` — 註冊 ProjectStore + register projects handler
- `apps/server/src/types.ts` — 加 ProjectStore 到 HandlerContext
- `apps/server/src/socket/handlers/index.ts` — 註冊 projects handler
- `packages/shared/src/index.ts` — re-export projects module
- `packages/shared/src/events.ts` — 加 EVENTS.projects
- `apps/web/src/contexts/ProjectContext.tsx` — 改為 server-backed
- `apps/web/src/contexts/__tests__/ProjectContext.test.tsx` — 改用 fake server emit projects events

**Migration risk**
- 既有 sessions 的 `projectRoot` 欄位需要 backfill 到 `projects` table（migration script）
- 需要 idempotent：upsert by path 確保重跑安全
- Multi-dialect：SQLite 和 MySQL migration 要同步寫
