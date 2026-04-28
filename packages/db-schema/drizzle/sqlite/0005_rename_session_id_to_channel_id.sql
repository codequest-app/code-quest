-- Rename session_id → channel_id in raw_entries
-- SQLite does not support RENAME COLUMN, so we recreate the table.
CREATE TABLE `raw_entries_new` (
	`id` text PRIMARY KEY NOT NULL,
	`channel_id` text NOT NULL,
	`prompt_id` text NOT NULL,
	`dir` text NOT NULL,
	`raw` text NOT NULL,
	`seq` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`channel_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `raw_entries_new` SELECT `id`, `session_id`, `prompt_id`, `dir`, `raw`, `seq`, `created_at` FROM `raw_entries`;
--> statement-breakpoint
DROP TABLE `raw_entries`;
--> statement-breakpoint
ALTER TABLE `raw_entries_new` RENAME TO `raw_entries`;
--> statement-breakpoint
CREATE INDEX `idx_raw_entries_session_created` ON `raw_entries` (`channel_id`,`created_at`,`seq`);
--> statement-breakpoint
-- Rename session_id → channel_id in messages
CREATE TABLE `messages_new` (
	`id` text PRIMARY KEY NOT NULL,
	`channel_id` text NOT NULL,
	`role` text NOT NULL,
	`type` text NOT NULL,
	`content` text NOT NULL,
	`seq` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`channel_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `messages_new` SELECT `id`, `session_id`, `role`, `type`, `content`, `seq`, `created_at` FROM `messages`;
--> statement-breakpoint
DROP TABLE `messages`;
--> statement-breakpoint
ALTER TABLE `messages_new` RENAME TO `messages`;
--> statement-breakpoint
CREATE INDEX `idx_messages_session_seq` ON `messages` (`channel_id`,`seq`);
