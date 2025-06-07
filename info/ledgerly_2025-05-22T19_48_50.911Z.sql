CREATE TABLE IF NOT EXISTS "categories" (
	"id" TEXT NOT NULL UNIQUE,
	"name" TEXT NOT NULL,
	PRIMARY KEY("id")
);

CREATE TABLE IF NOT EXISTS "transactions" (
	"id" TEXT NOT NULL UNIQUE,
	"created_at" TEXT NOT NULL,
	"description" TEXT,
	"posting_date" TEXT NOT NULL,
	"transaction_date" TEXT NOT NULL,
	"updated_at" TEXT NOT NULL,
	PRIMARY KEY("id")
);

CREATE TABLE IF NOT EXISTS "operations" (
	"id" TEXT NOT NULL UNIQUE,
	"transaction_id" TEXT NOT NULL,
	"created_at" TEXT NOT NULL,
	"updated_at" TEXT NOT NULL,
	"description" TEXT,
	"type" TEXT NOT NULL,
	"account_id" TEXT NOT NULL,
	"category_id" TEXT NOT NULL,
	PRIMARY KEY("id"),
	FOREIGN KEY ("account_id") REFERENCES "accounts"("id")
	ON UPDATE NO ACTION ON DELETE NO ACTION,
	FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id")
	ON UPDATE NO ACTION ON DELETE NO ACTION,
	FOREIGN KEY ("category_id") REFERENCES "categories"("id")
	ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE TABLE IF NOT EXISTS "accounts" (
	"id" TEXT NOT NULL UNIQUE,
	"currency_code" TEXT NOT NULL,
	"name" TEXT NOT NULL,
	"type" TEXT NOT NULL,
	"created_at" TEXT NOT NULL,
	"updated_at" TEXT NOT NULL,
	"description" TEXT,
	PRIMARY KEY("id")
);
