import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiUrl = (env.VITE_API_URL && !env.VITE_API_URL.includes('f2ef'))
    ? env.VITE_API_URL
    : 'https://hrms-backend-5xo8.onrender.com';

  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(apiUrl),
    },
    build: {
      assetsDir: 'static',
      emptyOutDir: true,
    },
    server: {
      host: '0.0.0.0',
      port: 80,
    },
  };
});
