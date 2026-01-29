ALTER TABLE `transactions` ADD `version` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `entries` ADD `version` integer DEFAULT 0 NOT NULL;