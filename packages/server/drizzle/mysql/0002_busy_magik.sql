RENAME TABLE `events` TO `raw_entries`;--> statement-breakpoint
ALTER TABLE `raw_entries` DROP FOREIGN KEY `events_session_id_sessions_id_fk`;
--> statement-breakpoint
DROP INDEX `idx_events_session_created` ON `raw_entries`;--> statement-breakpoint
ALTER TABLE `raw_entries` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `raw_entries` MODIFY COLUMN `id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `raw_entries` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `raw_entries` ADD `prompt_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `raw_entries` ADD `raw` text NOT NULL;--> statement-breakpoint
ALTER TABLE `raw_entries` ADD CONSTRAINT `raw_entries_session_id_sessions_id_fk` FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_raw_entries_session_created` ON `raw_entries` (`session_id`,`created_at`);--> statement-breakpoint
ALTER TABLE `raw_entries` DROP COLUMN `type`;--> statement-breakpoint
ALTER TABLE `raw_entries` DROP COLUMN `data`;