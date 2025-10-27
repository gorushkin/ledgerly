CREATE TABLE `entries` (
	`created_at` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`transaction_id` text NOT NULL,
	`updated_at` text NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_entries_tx` ON `entries` (`transaction_id`);