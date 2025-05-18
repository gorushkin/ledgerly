be:
	pnpm --filter backend dev

studio:
	pnpm --filter backend studio

fe:
	pnpm --filter frontend dev

dev:
	make -j2 be fe
