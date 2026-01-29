PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_transactions` (
	`created_at` text NOT NULL,
	`description` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`is_tombstone` integer NOT NULL,
	`posting_date` text NOT NULL,
	`transaction_date` text NOT NULL,
	`updated_at` text NOT NULL,
	`user_id` text NOT NULL,
	`version` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_transactions`("created_at", "description", "id", "is_tombstone", "posting_date", "transaction_date", "updated_at", "user_id", "version") SELECT "created_at", "description", "id", "is_tombstone", "posting_date", "transaction_date", "updated_at", "user_id", "version" FROM `transactions`;--> statement-breakpoint
DROP TABLE `transactions`;--> statement-breakpoint
ALTER TABLE `__new_transactions` RENAME TO `transactions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_transactions_user_date` ON `transactions` (`user_id`,`transaction_date`);--> statement-breakpoint
CREATE TABLE `__new_entries` (
	`created_at` text NOT NULL,
	`description` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`is_tombstone` integer NOT NULL,
	`transaction_id` text NOT NULL,
	`updated_at` text NOT NULL,
	`user_id` text NOT NULL,
	`version` integer NOT NULL,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_entries`("created_at", "description", "id", "is_tombstone", "transaction_id", "updated_at", "user_id", "version") SELECT "created_at", "description", "id", "is_tombstone", "transaction_id", "updated_at", "user_id", "version" FROM `entries`;--> statement-breakpoint
DROP TABLE `entries`;--> statement-breakpoint
ALTER TABLE `__new_entries` RENAME TO `entries`;--> statement-breakpoint
CREATE INDEX `idx_entries_tx` ON `entries` (`transaction_id`);--> statement-breakpoint
CREATE INDEX `idx_entries_user` ON `entries` (`user_id`);