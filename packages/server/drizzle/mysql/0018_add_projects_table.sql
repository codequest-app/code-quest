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
CREATE INDEX `idx_projects_pinned_last_opened` ON `projects` (`pinned`,`last_opened_at`);
--> statement-breakpoint
INSERT INTO `projects` (id, path, name, pinned, color, last_opened_at, created_at)
SELECT
	UUID(),
	project_root,
	SUBSTRING_INDEX(project_root, '/', -1),
	false,
	NULL,
	COALESCE(MAX(created_at), DATE_FORMAT(NOW(), '%Y-%m-%dT%H:%i:%sZ')),
	COALESCE(MIN(created_at), DATE_FORMAT(NOW(), '%Y-%m-%dT%H:%i:%sZ'))
FROM `sessions`
WHERE project_root IS NOT NULL AND project_root != ''
GROUP BY project_root;
