-- Backfill NULL project_root from cwd (or empty string when both are null)
-- before enforcing NOT NULL. Also move the column physically after `cwd`
-- so its position matches the drizzle schema order.
UPDATE `sessions` SET `project_root` = COALESCE(`project_root`, `cwd`, '') WHERE `project_root` IS NULL;--> statement-breakpoint
ALTER TABLE `sessions` MODIFY COLUMN `project_root` text NOT NULL AFTER `cwd`;
