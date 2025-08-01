PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_transactions` (
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`hash` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`posting_date` text NOT NULL,
	`transaction_date` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_transactions`("created_at", "description", "hash", "id", "posting_date", "transaction_date", "updated_at", "user_id") SELECT "created_at", "description", "hash", "id", "posting_date", "transaction_date", "updated_at", "user_id" FROM `transactions`;--> statement-breakpoint
DROP TABLE `transactions`;--> statement-breakpoint
ALTER TABLE `__new_transactions` RENAME TO `transactions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_operations` (
	`account_id` text NOT NULL,
	`category_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`hash` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`local_amount` real NOT NULL,
	`original_amount` real NOT NULL,
	`transaction_id` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_operations`("account_id", "category_id", "created_at", "description", "hash", "id", "local_amount", "original_amount", "transaction_id", "updated_at", "user_id") SELECT "account_id", "category_id", "created_at", "description", "hash", "id", "local_amount", "original_amount", "transaction_id", "updated_at", "user_id" FROM `operations`;--> statement-breakpoint
DROP TABLE `operations`;--> statement-breakpoint
ALTER TABLE `__new_operations` RENAME TO `operations`;