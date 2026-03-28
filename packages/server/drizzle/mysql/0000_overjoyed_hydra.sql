CREATE TABLE `raw_entries` (
	`id` varchar(36) NOT NULL,
	`session_id` varchar(36) NOT NULL,
	`prompt_id` varchar(36) NOT NULL,
	`dir` varchar(10) NOT NULL,
	`raw` text NOT NULL,
	`seq` int NOT NULL DEFAULT 0,
	`created_at` varchar(30) NOT NULL,
	CONSTRAINT `raw_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` varchar(36) NOT NULL,
	`provider` varchar(20) NOT NULL,
	`command` varchar(255) NOT NULL,
	`args` text NOT NULL,
	`cwd` text,
	`mode` varchar(20) NOT NULL DEFAULT 'print',
	`role` varchar(20) NOT NULL DEFAULT 'chat',
	`parent_id` varchar(36),
	`created_at` varchar(30) NOT NULL,
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `raw_entries` ADD CONSTRAINT `raw_entries_session_id_sessions_id_fk` FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_raw_entries_session_created` ON `raw_entries` (`session_id`,`created_at`,`seq`);