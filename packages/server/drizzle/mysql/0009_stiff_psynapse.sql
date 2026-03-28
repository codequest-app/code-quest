ALTER TABLE `raw_entries` DROP FOREIGN KEY `raw_entries_session_id_sessions_id_fk`;
--> statement-breakpoint
ALTER TABLE `sessions` ADD `session_id` varchar(64);--> statement-breakpoint
ALTER TABLE `sessions` ADD `title` varchar(200);--> statement-breakpoint
ALTER TABLE `sessions` ADD `status` varchar(20) DEFAULT 'active' NOT NULL;