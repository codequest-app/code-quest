CREATE TABLE `messages` (
	`id` varchar(36) NOT NULL,
	`session_id` varchar(36) NOT NULL,
	`role` varchar(20) NOT NULL,
	`type` varchar(30) NOT NULL,
	`content` text NOT NULL,
	`seq` int NOT NULL DEFAULT 0,
	`created_at` varchar(30) NOT NULL,
	CONSTRAINT `messages_id` PRIMARY KEY(`id`),
	CONSTRAINT `messages_session_id_sessions_id_fk` FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON DELETE no action ON UPDATE no action
);
--> statement-breakpoint
CREATE INDEX `idx_messages_session_seq` ON `messages` (`session_id`,`seq`);
