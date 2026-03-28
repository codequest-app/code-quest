-- raw_entries: column already renamed in partial apply
-- Drop FK first so we can rename the index
ALTER TABLE `raw_entries` DROP FOREIGN KEY `raw_entries_channel_id_sessions_id_fk`;
--> statement-breakpoint
DROP INDEX `idx_raw_entries_session_created` ON `raw_entries`;
--> statement-breakpoint
CREATE INDEX `idx_raw_entries_channel_created` ON `raw_entries` (`channel_id`,`created_at`,`seq`);
--> statement-breakpoint
ALTER TABLE `raw_entries` ADD CONSTRAINT `raw_entries_channel_id_sessions_id_fk` FOREIGN KEY (`channel_id`) REFERENCES `sessions`(`id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
-- Rename session_id → channel_id in messages
ALTER TABLE `messages` DROP FOREIGN KEY `messages_session_id_sessions_id_fk`;
--> statement-breakpoint
ALTER TABLE `messages` RENAME COLUMN `session_id` TO `channel_id`;
--> statement-breakpoint
DROP INDEX `idx_messages_session_seq` ON `messages`;
--> statement-breakpoint
CREATE INDEX `idx_messages_channel_seq` ON `messages` (`channel_id`,`seq`);
--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_channel_id_sessions_id_fk` FOREIGN KEY (`channel_id`) REFERENCES `sessions`(`id`) ON DELETE no action ON UPDATE no action;
