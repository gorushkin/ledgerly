import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  build: {
    outDir: "dist",
    target: "node18",
    lib: {
      entry: "./src/index.ts",
      formats: ["es"],
    },
    rollupOptions: {
      external: [
        // оставляем внешние зависимости, чтобы не тащить их в билд
        "better-sqlite3",
        "fastify",
        "zod",
        "dotenv",
        "fs",
        "path",
      ],
    },
  },
});
