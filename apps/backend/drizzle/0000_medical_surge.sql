CREATE TABLE `accounts` (
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`original_currency` text DEFAULT 'RUB',
	`type` text DEFAULT 'cash' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`original_currency`) REFERENCES `currencies`(`code`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`posting_date` text NOT NULL,
	`transaction_date` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `currencies` (
	`code` text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE `operations` (
	`account_id` text NOT NULL,
	`category_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`local_amount` real NOT NULL,
	`original_amount` real NOT NULL,
	`transaction_id` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE cascade
);
