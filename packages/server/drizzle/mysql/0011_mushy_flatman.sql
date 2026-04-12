ALTER TABLE `sessions` RENAME COLUMN `id` TO `channel_id`;--> statement-breakpoint
ALTER TABLE `sessions` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `sessions` ADD PRIMARY KEY(`channel_id`);