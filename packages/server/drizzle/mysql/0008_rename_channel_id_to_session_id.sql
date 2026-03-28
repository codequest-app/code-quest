-- Rename channel_id to session_id in messages table
ALTER TABLE `messages` CHANGE `channel_id` `session_id` VARCHAR(36) NOT NULL;
--> statement-breakpoint
-- Rename channel_id to session_id in raw_entries table
ALTER TABLE `raw_entries` CHANGE `channel_id` `session_id` VARCHAR(36) NOT NULL;
