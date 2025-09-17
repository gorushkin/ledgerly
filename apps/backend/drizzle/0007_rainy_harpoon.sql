PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_operations` (
	`account_id` text NOT NULL,
	`base_amount` integer NOT NULL,
	`created_at` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`entry_id` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`is_tombstone` integer DEFAULT false NOT NULL,
	`updated_at` text NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`entry_id`) REFERENCES `entries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_operations`("account_id", "base_amount", "created_at", "description", "entry_id", "id", "is_tombstone", "updated_at", "user_id") SELECT "account_id", "base_amount", "created_at", "description", "entry_id", "id", "is_tombstone", "updated_at", "user_id" FROM `operations`;--> statement-breakpoint
DROP TABLE `operations`;--> statement-breakpoint
ALTER TABLE `__new_operations` RENAME TO `operations`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_operations_entry` ON `operations` (`entry_id`);--> statement-breakpoint
CREATE INDEX `idx_operations_account` ON `operations` (`account_id`);--> statement-breakpoint
CREATE INDEX `idx_operations_user` ON `operations` (`user_id`);