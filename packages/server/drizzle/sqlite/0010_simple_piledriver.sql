CREATE TABLE `settings` (
	`provider` text NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	PRIMARY KEY(`provider`, `key`)
);
