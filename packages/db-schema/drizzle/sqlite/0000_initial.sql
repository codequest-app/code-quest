CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`path` text NOT NULL,
	`name` text NOT NULL,
	`pinned` integer DEFAULT false NOT NULL,
	`color` text,
	`last_opened_at` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_path_unique` ON `projects` (`path`);--> statement-breakpoint
CREATE INDEX `idx_projects_pinned_last_opened` ON `projects` (`pinned`,`last_opened_at`);--> statement-breakpoint
CREATE TABLE `raw_deltas` (
	`id` text PRIMARY KEY NOT NULL,
	`parent_id` text NOT NULL,
	`session_id` text NOT NULL,
	`dir` text NOT NULL,
	`raw` text NOT NULL,
	`seq` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_raw_deltas_session_seq` ON `raw_deltas` (`session_id`,`seq`);--> statement-breakpoint
CREATE INDEX `idx_raw_deltas_parent` ON `raw_deltas` (`parent_id`);--> statement-breakpoint
CREATE TABLE `raw_events` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`dir` text NOT NULL,
	`raw` text NOT NULL,
	`seq` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_raw_events_session_created` ON `raw_events` (`session_id`,`created_at`,`seq`);--> statement-breakpoint
CREATE INDEX `idx_raw_events_session_dir_seq` ON `raw_events` (`session_id`,`dir`,`seq`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`parent_id` text,
	`channel_id` text,
	`provider` text NOT NULL,
	`command` text NOT NULL,
	`args` text NOT NULL,
	`cwd` text,
	`project_root` text NOT NULL,
	`mode` text DEFAULT 'print' NOT NULL,
	`role` text DEFAULT 'chat' NOT NULL,
	`title` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_sessions_channel_id` ON `sessions` (`channel_id`);--> statement-breakpoint
CREATE TABLE `settings` (
	`provider` text NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	PRIMARY KEY(`provider`, `key`)
);
