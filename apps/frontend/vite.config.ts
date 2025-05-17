import path from 'path';

import tailwindcss from '@tailwindcss/vite';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

const DEFAULT_HOST = 'localhost';
const DEFAULT_PORT = 3500;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '../..'), '');

  const host = env.FRONTEND_HOST ?? DEFAULT_HOST;
  const port = env.FRONTEND_PORT ? Number(env.FRONTEND_PORT) : DEFAULT_PORT;

  return {
    envDir: path.resolve(__dirname, '../..'),
    plugins: [
      TanStackRouterVite({ autoCodeSplitting: true, target: 'react' }),
      react(),
      tailwindcss(),
      tsconfigPaths(),
    ],
    server: {
      host,
      open: true,
      port,
      strictPort: true,
    },
  };
});
