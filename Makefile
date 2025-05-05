be:
	pnpm --filter backend dev

fe:
	pnpm --filter frontend dev

dev:
	make -j2 be fe

studio:
	cd apps/backend && npx drizzle-kit studio