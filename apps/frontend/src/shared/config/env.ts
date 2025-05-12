export const envConfig = {
  API_TOKEN: import.meta.env.VITE_API_TOKEN,
  API_URL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  NODE_ENV: import.meta.env.MODE || 'development',
};
