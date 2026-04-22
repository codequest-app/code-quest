-- Same plan as sqlite 0016: copy deltas out, delete from source, rename source.
CREATE TABLE `raw_deltas` (
	`id` varchar(36) NOT NULL,
	`parent_id` varchar(36) NOT NULL,
	`session_id` varchar(36) NOT NULL,
	`dir` varchar(10) NOT NULL,
	`raw` mediumtext NOT NULL,
	`seq` int DEFAULT 0 NOT NULL,
	`created_at` varchar(30) NOT NULL,
	CONSTRAINT `raw_deltas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_raw_deltas_session_seq` ON `raw_deltas` (`session_id`,`seq`);
--> statement-breakpoint
CREATE INDEX `idx_raw_deltas_parent` ON `raw_deltas` (`parent_id`);
--> statement-breakpoint
INSERT INTO `raw_deltas` (`id`, `parent_id`, `session_id`, `dir`, `raw`, `seq`, `created_at`)
SELECT `id`, '', `session_id`, `dir`, `raw`, `seq`, `created_at`
FROM `raw_entries`
WHERE `raw` LIKE '%"type":"stream_event"%' AND `raw` LIKE '%"content_block_delta"%';
--> statement-breakpoint
DELETE FROM `raw_entries`
WHERE `raw` LIKE '%"type":"stream_event"%' AND `raw` LIKE '%"content_block_delta"%';
--> statement-breakpoint
RENAME TABLE `raw_entries` TO `raw_events`;
--> statement-breakpoint
ALTER TABLE `raw_events` RENAME INDEX `idx_raw_entries_session_created` TO `idx_raw_events_session_created`;
