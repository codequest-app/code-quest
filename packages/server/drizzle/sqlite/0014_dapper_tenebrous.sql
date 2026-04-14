-- Make project_root NOT NULL. Backfill existing NULL values with cwd
-- (worktrees will still group under their main repo once a resume runs
-- gitService.getProjectRoot; main-tree sessions already have cwd==projectRoot).
-- SQLite cannot ALTER a column's NOT NULL, so recreate the table.
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`parent_id` text,
	`channel_id` text,
	`provider` text NOT NULL,
	`command` text NOT NULL,
	`args` text NOT NULL,
	`cwd` text,
	`project_root` text NOT NULL,
	`mode` text DEFAULT 'print' NOT NULL,
	`role` text DEFAULT 'chat' NOT NULL,
	`title` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_sessions`("id", "parent_id", "channel_id", "provider", "command", "args", "cwd", "project_root", "mode", "role", "title", "status", "created_at") SELECT "id", "parent_id", "channel_id", "provider", "command", "args", "cwd", COALESCE("project_root", "cwd", ''), "mode", "role", "title", "status", "created_at" FROM `sessions`;--> statement-breakpoint
DROP TABLE `sessions`;--> statement-breakpoint
ALTER TABLE `__new_sessions` RENAME TO `sessions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_sessions_channel_id` ON `sessions` (`channel_id`);
