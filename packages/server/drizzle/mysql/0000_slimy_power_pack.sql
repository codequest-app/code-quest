CREATE TABLE `events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`session_id` varchar(36) NOT NULL,
	`dir` varchar(10) NOT NULL,
	`type` varchar(100) NOT NULL,
	`data` text NOT NULL,
	`created_at` varchar(30) NOT NULL,
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` varchar(36) NOT NULL,
	`provider` varchar(20) NOT NULL,
	`command` varchar(255) NOT NULL,
	`args` text NOT NULL,
	`cwd` text,
	`mode` varchar(20) NOT NULL DEFAULT 'print',
	`created_at` varchar(30) NOT NULL,
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `events` ADD CONSTRAINT `events_session_id_sessions_id_fk` FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_events_session_created` ON `events` (`session_id`,`created_at`);