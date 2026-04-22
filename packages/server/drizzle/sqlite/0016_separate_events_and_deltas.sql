-- Separate delta stream events into a dedicated raw_deltas table, rename
-- raw_entries → raw_events. Order matters:
--   1. Create raw_deltas (empty, new shape with parent_id).
--   2. Copy existing content_block_delta rows from raw_entries → raw_deltas
--      (parent_id = '' since historical rows have no turn attribution).
--   3. Delete copied rows from raw_entries.
--   4. Rename raw_entries → raw_events and update its index name.

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
ALTER TABLE `raw_entries` RENAME TO `raw_events`;
--> statement-breakpoint
DROP INDEX IF EXISTS `idx_raw_entries_session_created`;
--> statement-breakpoint
CREATE INDEX `idx_raw_events_session_created` ON `raw_events` (`session_id`,`created_at`,`seq`);
