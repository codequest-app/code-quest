-- Add `projects` table for persistent project entities.
-- Backfill from existing sessions.project_root with name = path (will be
-- overwritten naturally by ProjectStore.upsert on next session.create with
-- proper basename). SQLite lacks reverse/SUBSTRING_INDEX so we keep this simple.

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
CREATE UNIQUE INDEX `projects_path_unique` ON `projects` (`path`);
--> statement-breakpoint
CREATE INDEX `idx_projects_pinned_last_opened` ON `projects` (`pinned`,`last_opened_at`);
--> statement-breakpoint
INSERT INTO `projects` (id, path, name, pinned, color, last_opened_at, created_at)
SELECT
	lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' ||
		substr(lower(hex(randomblob(2))), 2) || '-' ||
		substr('89ab', abs(random()) % 4 + 1, 1) ||
		substr(lower(hex(randomblob(2))), 2) || '-' ||
		lower(hex(randomblob(6))),
	project_root,
	project_root,
	0,
	NULL,
	COALESCE(MAX(created_at), datetime('now')),
	COALESCE(MIN(created_at), datetime('now'))
FROM `sessions`
WHERE project_root IS NOT NULL AND project_root != ''
GROUP BY project_root;
