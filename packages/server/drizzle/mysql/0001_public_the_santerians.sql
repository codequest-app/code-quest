ALTER TABLE `sessions` ADD `role` varchar(20) DEFAULT 'chat' NOT NULL;--> statement-breakpoint
ALTER TABLE `sessions` ADD `parent_id` varchar(36);