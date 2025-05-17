export const envConfig = {
  API_TOKEN: import.meta.env.VITE_API_TOKEN,
  API_URL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  FRONTEND_URL: import.meta.env.FRONTEND_URL ?? 'http://localhost:5176',
  NODE_ENV: import.meta.env.MODE || 'development',
};
