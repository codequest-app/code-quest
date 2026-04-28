-- Remove FK constraint from raw_entries.channel_id → sessions.id
-- SQLite does not support DROP CONSTRAINT, so we recreate the table without the FK.
CREATE TABLE `raw_entries_new` (
	`id` text PRIMARY KEY NOT NULL,
	`channel_id` text NOT NULL,
	`prompt_id` text NOT NULL,
	`dir` text NOT NULL,
	`raw` text NOT NULL,
	`seq` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `raw_entries_new` SELECT `id`, `channel_id`, `prompt_id`, `dir`, `raw`, `seq`, `created_at` FROM `raw_entries`;
--> statement-breakpoint
DROP TABLE `raw_entries`;
--> statement-breakpoint
ALTER TABLE `raw_entries_new` RENAME TO `raw_entries`;
--> statement-breakpoint
CREATE INDEX `idx_raw_entries_session_created` ON `raw_entries` (`channel_id`,`created_at`,`seq`);