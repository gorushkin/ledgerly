PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_operations` (
	`account_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`hash` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`is_tombstone` integer DEFAULT false NOT NULL,
	`local_amount` real NOT NULL,
	`original_amount` real NOT NULL,
	`transaction_id` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_operations`("account_id", "created_at", "description", "hash", "id", "is_tombstone", "local_amount", "original_amount", "transaction_id", "updated_at", "user_id") SELECT "account_id", "created_at", "description", "hash", "id", "is_tombstone", "local_amount", "original_amount", "transaction_id", "updated_at", "user_id" FROM `operations`;--> statement-breakpoint
DROP TABLE `operations`;--> statement-breakpoint
ALTER TABLE `__new_operations` RENAME TO `operations`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_accounts` (
	`balance` real NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`initial_balance` real NOT NULL,
	`name` text NOT NULL,
	`original_currency` text NOT NULL,
	`type` text DEFAULT 'asset' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`original_currency`) REFERENCES `currencies`(`code`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_accounts`("balance", "created_at", "description", "id", "initial_balance", "name", "original_currency", "type", "updated_at", "user_id") SELECT "balance", "created_at", "description", "id", "initial_balance", "name", "original_currency", "type", "updated_at", "user_id" FROM `accounts`;--> statement-breakpoint
DROP TABLE `accounts`;--> statement-breakpoint
ALTER TABLE `__new_accounts` RENAME TO `accounts`;--> statement-breakpoint
CREATE UNIQUE INDEX `user_id_name_unique_idx` ON `accounts` (`user_id`,`name`);