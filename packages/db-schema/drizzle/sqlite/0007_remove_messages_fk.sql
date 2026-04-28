-- Remove FK constraint from messages.channel_id → sessions.id
-- SQLite does not support DROP CONSTRAINT, so we recreate the table without the FK.
CREATE TABLE `messages_new` (
	`id` text PRIMARY KEY NOT NULL,
	`channel_id` text NOT NULL,
	`role` text NOT NULL,
	`type` text NOT NULL,
	`content` text NOT NULL,
	`seq` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `messages_new` SELECT `id`, `channel_id`, `role`, `type`, `content`, `seq`, `created_at` FROM `messages`;
--> statement-breakpoint
DROP TABLE `messages`;
--> statement-breakpoint
ALTER TABLE `messages_new` RENAME TO `messages`;
--> statement-breakpoint
CREATE INDEX `idx_messages_session_seq` ON `messages` (`channel_id`,`seq`);
