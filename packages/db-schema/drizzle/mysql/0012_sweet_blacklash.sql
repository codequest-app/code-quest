-- Align sessions schema with live MySQL:
--   OLD: channel_id (PK) + session_id (nullable)
--   NEW: id (PK = was session_id, varchar(64)) + channel_id (non-PK indexed, varchar(36))
-- For rows where session_id was NULL, fall back to channel_id so the new PK is NOT NULL.
UPDATE `sessions` SET `session_id` = `channel_id` WHERE `session_id` IS NULL;--> statement-breakpoint
ALTER TABLE `sessions` RENAME COLUMN `session_id` TO `id`;--> statement-breakpoint
ALTER TABLE `sessions` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `sessions` MODIFY COLUMN `channel_id` varchar(36);--> statement-breakpoint
ALTER TABLE `sessions` MODIFY COLUMN `id` varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE `sessions` ADD PRIMARY KEY(`id`);--> statement-breakpoint
CREATE INDEX `idx_sessions_channel_id` ON `sessions` (`channel_id`);
