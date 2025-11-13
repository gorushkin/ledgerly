DROP INDEX `idx_transactions_user`;--> statement-breakpoint
DROP INDEX `idx_transactions_date`;--> statement-breakpoint
CREATE INDEX `idx_transactions_user_date` ON `transactions` (`user_id`,`transaction_date`);