DROP INDEX IF EXISTS `idx_events_session_created`;--> statement-breakpoint
CREATE TABLE `raw_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`prompt_id` text NOT NULL,
	`dir` text NOT NULL,
	`raw` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);--> statement-breakpoint
CREATE INDEX `idx_raw_entries_session_created` ON `raw_entries` (`session_id`,`created_at`);--> statement-breakpoint
DROP TABLE `events`;
