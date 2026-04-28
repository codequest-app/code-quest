-- Align sessions schema with live MySQL:
--   OLD: channel_id (PK) + session_id (nullable column)
--   NEW: id (PK = was session_id) + channel_id (non-PK indexed column)
-- SQLite doesn't support RENAME + re-PK, so recreate the table.
-- For rows where session_id was NULL, fall back to channel_id so PK remains NOT NULL.
-- Column order matches live MySQL: id, parent_id, channel_id, ...
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`parent_id` text,
	`channel_id` text,
	`provider` text NOT NULL,
	`command` text NOT NULL,
	`args` text NOT NULL,
	`cwd` text,
	`mode` text DEFAULT 'print' NOT NULL,
	`role` text DEFAULT 'chat' NOT NULL,
	`title` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_sessions`("id", "parent_id", "channel_id", "provider", "command", "args", "cwd", "mode", "role", "title", "status", "created_at")
SELECT COALESCE("session_id", "channel_id"), "parent_id", "channel_id", "provider", "command", "args", "cwd", "mode", "role", "title", "status", "created_at" FROM `sessions`;--> statement-breakpoint
DROP TABLE `sessions`;--> statement-breakpoint
ALTER TABLE `__new_sessions` RENAME TO `sessions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_sessions_channel_id` ON `sessions` (`channel_id`);
