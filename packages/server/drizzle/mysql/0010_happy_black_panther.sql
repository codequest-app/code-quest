CREATE TABLE `settings` (
	`provider` varchar(20) NOT NULL,
	`key` varchar(100) NOT NULL,
	`value` text NOT NULL,
	CONSTRAINT `settings_provider_key_pk` PRIMARY KEY(`provider`,`key`)
);
