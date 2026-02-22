ALTER TABLE `sessions` ADD `role` text DEFAULT 'chat' NOT NULL;--> statement-breakpoint
ALTER TABLE `sessions` ADD `parent_id` text;