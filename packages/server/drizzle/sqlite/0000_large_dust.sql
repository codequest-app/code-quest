CREATE TABLE `raw_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`prompt_id` text NOT NULL,
	`dir` text NOT NULL,
	`raw` text NOT NULL,
	`seq` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_raw_entries_session_created` ON `raw_entries` (`session_id`,`created_at`,`seq`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`command` text NOT NULL,
	`args` text NOT NULL,
	`cwd` text,
	`mode` text DEFAULT 'print' NOT NULL,
	`role` text DEFAULT 'chat' NOT NULL,
	`parent_id` text,
	`created_at` text NOT NULL
);
