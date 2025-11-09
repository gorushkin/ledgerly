PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_accounts` (
	`created_at` text NOT NULL,
	`currency` text NOT NULL,
	`current_cleared_balance_local` text NOT NULL,
	`description` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`initial_balance` text NOT NULL,
	`is_system` integer NOT NULL,
	`is_tombstone` integer NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`updated_at` text NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_accounts`("created_at", "currency", "current_cleared_balance_local", "description", "id", "initial_balance", "is_system", "is_tombstone", "name", "type", "updated_at", "user_id") SELECT "created_at", "currency", "current_cleared_balance_local", "description", "id", "initial_balance", "is_system", "is_tombstone", "name", "type", "updated_at", "user_id" FROM `accounts`;--> statement-breakpoint
DROP TABLE `accounts`;--> statement-breakpoint
ALTER TABLE `__new_accounts` RENAME TO `accounts`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `user_id_name_unique_idx` ON `accounts` (`user_id`,`name`);