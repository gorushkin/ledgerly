export const envConfig = {
  API_URL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  NODE_ENV: import.meta.env.MODE || "development",
  API_TOKEN: import.meta.env.VITE_API_TOKEN, // Add other environment variables as needed
};
