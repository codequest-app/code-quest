CREATE TABLE `projects` (
	`id` varchar(36) NOT NULL,
	`path` varchar(768) NOT NULL,
	`name` varchar(255) NOT NULL,
	`pinned` boolean NOT NULL DEFAULT false,
	`color` varchar(16),
	`last_opened_at` varchar(30) NOT NULL,
	`created_at` varchar(30) NOT NULL,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`),
	CONSTRAINT `projects_path_unique` UNIQUE(`path`)
);
--> statement-breakpoint
CREATE TABLE `raw_deltas` (
	`id` varchar(36) NOT NULL,
	`parent_id` varchar(36) NOT NULL,
	`session_id` varchar(36) NOT NULL,
	`dir` varchar(10) NOT NULL,
	`raw` mediumtext NOT NULL,
	`seq` int NOT NULL DEFAULT 0,
	`created_at` varchar(30) NOT NULL,
	CONSTRAINT `raw_deltas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `raw_events` (
	`id` varchar(36) NOT NULL,
	`session_id` varchar(36) NOT NULL,
	`dir` varchar(10) NOT NULL,
	`raw` mediumtext NOT NULL,
	`seq` int NOT NULL DEFAULT 0,
	`created_at` varchar(30) NOT NULL,
	CONSTRAINT `raw_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` varchar(64) NOT NULL,
	`parent_id` varchar(36),
	`channel_id` varchar(36),
	`provider` varchar(20) NOT NULL,
	`command` varchar(255) NOT NULL,
	`args` text NOT NULL,
	`cwd` text,
	`project_root` text NOT NULL,
	`mode` varchar(20) NOT NULL DEFAULT 'print',
	`role` varchar(20) NOT NULL DEFAULT 'chat',
	`title` varchar(200),
	`status` varchar(20) NOT NULL DEFAULT 'active',
	`created_at` varchar(30) NOT NULL,
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`provider` varchar(20) NOT NULL,
	`key` varchar(100) NOT NULL,
	`value` text NOT NULL,
	CONSTRAINT `settings_provider_key_pk` PRIMARY KEY(`provider`,`key`)
);
--> statement-breakpoint
CREATE INDEX `idx_projects_pinned_last_opened` ON `projects` (`pinned`,`last_opened_at`);--> statement-breakpoint
CREATE INDEX `idx_raw_deltas_session_seq` ON `raw_deltas` (`session_id`,`seq`);--> statement-breakpoint
CREATE INDEX `idx_raw_deltas_parent` ON `raw_deltas` (`parent_id`);--> statement-breakpoint
CREATE INDEX `idx_raw_events_session_created` ON `raw_events` (`session_id`,`created_at`,`seq`);--> statement-breakpoint
CREATE INDEX `idx_raw_events_session_dir_seq` ON `raw_events` (`session_id`,`dir`,`seq`);--> statement-breakpoint
CREATE INDEX `idx_sessions_channel_id` ON `sessions` (`channel_id`);