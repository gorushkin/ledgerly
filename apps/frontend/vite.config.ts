import path from 'path';

import tailwindcss from '@tailwindcss/vite';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vite.dev/config/
export default defineConfig({
  // envDir: path.resolve(__dirname, '../..'),
  plugins: [TanStackRouterVite({ autoCodeSplitting: true, target: 'react' }), react(), tailwindcss(), tsconfigPaths()],
  resolve: {
    alias: {
      shared: path.resolve(__dirname, '../../packages/shared'),
    },
  },
  // server: {
  //   origin: 'http://localhost:3500',
  //   port: 3000,
  // },
});
