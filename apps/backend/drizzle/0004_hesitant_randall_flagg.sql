PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_transactions` (
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`id` text,
	`posting_date` text NOT NULL,
	`transaction_date` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_transactions`("created_at", "description", "id", "posting_date", "transaction_date", "updated_at", "user_id") SELECT "created_at", "description", "id", "posting_date", "transaction_date", "updated_at", "user_id" FROM `transactions`;--> statement-breakpoint
DROP TABLE `transactions`;--> statement-breakpoint
ALTER TABLE `__new_transactions` RENAME TO `transactions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;