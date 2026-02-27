DROP INDEX `idx_events_session_created` ON `events`;--> statement-breakpoint
CREATE TABLE `raw_entries` (
	`id` varchar(36) NOT NULL,
	`session_id` varchar(36) NOT NULL,
	`prompt_id` varchar(36) NOT NULL,
	`dir` varchar(10) NOT NULL,
	`raw` text NOT NULL,
	`created_at` varchar(30) NOT NULL,
	CONSTRAINT `raw_entries_id` PRIMARY KEY(`id`),
	CONSTRAINT `raw_entries_session_id_sessions_id_fk` FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);--> statement-breakpoint
CREATE INDEX `idx_raw_entries_session_created` ON `raw_entries` (`session_id`,`created_at`);--> statement-breakpoint
DROP TABLE `events`;
