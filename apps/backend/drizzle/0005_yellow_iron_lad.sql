PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_operations` (
	`account_id` text NOT NULL,
	`category_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`id` text,
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
INSERT INTO `__new_operations`("account_id", "category_id", "created_at", "description", "id", "local_amount", "original_amount", "transaction_id", "updated_at", "user_id") SELECT "account_id", "category_id", "created_at", "description", "id", "local_amount", "original_amount", "transaction_id", "updated_at", "user_id" FROM `operations`;--> statement-breakpoint
DROP TABLE `operations`;--> statement-breakpoint
ALTER TABLE `__new_operations` RENAME TO `operations`;--> statement-breakpoint
PRAGMA foreign_keys=ON;