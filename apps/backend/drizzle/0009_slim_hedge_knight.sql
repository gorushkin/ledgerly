ALTER TABLE `transactions` ADD `is_tombstone` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `operations` ADD `is_tombstone` integer DEFAULT false NOT NULL;