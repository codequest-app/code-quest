DROP TABLE `messages`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_raw_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`prompt_id` text NOT NULL,
	`dir` text NOT NULL,
	`raw` text NOT NULL,
	`seq` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_raw_entries`("id", "session_id", "prompt_id", "dir", "raw", "seq", "created_at") SELECT "id", "session_id", "prompt_id", "dir", "raw", "seq", "created_at" FROM `raw_entries`;--> statement-breakpoint
DROP TABLE `raw_entries`;--> statement-breakpoint
ALTER TABLE `__new_raw_entries` RENAME TO `raw_entries`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_raw_entries_session_created` ON `raw_entries` (`session_id`,`created_at`,`seq`);