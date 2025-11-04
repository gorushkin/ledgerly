ALTER TABLE `accounts` ADD `is_system` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `operations` DROP COLUMN `is_system`;