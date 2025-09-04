PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_operations` (
	`account_id` text NOT NULL,
	`base_amount` integer NOT NULL,
	`created_at` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`is_tombstone` integer DEFAULT false NOT NULL,
	`local_amount` integer NOT NULL,
	`rate_base_per_local` integer NOT NULL,
	`transaction_id` text NOT NULL,
	`updated_at` text NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_operations`("account_id", "base_amount", "created_at", "description", "id", "is_tombstone", "local_amount", "rate_base_per_local", "transaction_id", "updated_at", "user_id") SELECT "account_id", "base_amount", "created_at", "description", "id", "is_tombstone", "local_amount", "rate_base_per_local", "transaction_id", "updated_at", "user_id" FROM `operations`;--> statement-breakpoint
DROP TABLE `operations`;--> statement-breakpoint
ALTER TABLE `__new_operations` RENAME TO `operations`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_operations_tx` ON `operations` (`transaction_id`);--> statement-breakpoint
CREATE INDEX `idx_operations_account` ON `operations` (`account_id`);--> statement-breakpoint
CREATE INDEX `idx_operations_user` ON `operations` (`user_id`);--> statement-breakpoint
CREATE TABLE `__new_accounts` (
	`created_at` text NOT NULL,
	`current_cleared_balance_local` real NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`initial_balance` real NOT NULL,
	`name` text NOT NULL,
	`original_currency` text NOT NULL,
	`type` text NOT NULL,
	`updated_at` text NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`original_currency`) REFERENCES `currencies`(`code`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_accounts`("created_at", "current_cleared_balance_local", "description", "id", "initial_balance", "name", "original_currency", "type", "updated_at", "user_id") SELECT "created_at", "current_cleared_balance_local", "description", "id", "initial_balance", "name", "original_currency", "type", "updated_at", "user_id" FROM `accounts`;--> statement-breakpoint
DROP TABLE `accounts`;--> statement-breakpoint
ALTER TABLE `__new_accounts` RENAME TO `accounts`;--> statement-breakpoint
CREATE UNIQUE INDEX `user_id_name_unique_idx` ON `accounts` (`user_id`,`name`);