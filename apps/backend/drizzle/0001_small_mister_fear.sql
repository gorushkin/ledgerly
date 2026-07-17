CREATE TABLE `commodities` (
	`code` text NOT NULL,
	`created_at` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`is_tombstone` integer NOT NULL,
	`name` text NOT NULL,
	`precision` integer NOT NULL,
	`symbol` text,
	`updated_at` text NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `commodities_user_id_code_unique_idx` ON `commodities` (`user_id`,`code`);--> statement-breakpoint
ALTER TABLE `accounts` ADD `commodity_id` text NOT NULL REFERENCES commodities(id);