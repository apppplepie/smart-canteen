import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const envDir = path.resolve(__dirname, '..');
  const env = loadEnv(mode, envDir, '');
  return {
    base: env.VITE_PUBLIC_PATH ?? '/',
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.DEEPSEEK_API_KEY': JSON.stringify(env.DEEPSEEK_API_KEY),
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL ?? ''),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        '@scs/api': path.resolve(__dirname, '../shared/api'),
      },
    },
    server: {
      port: 5174,
      host: 'localhost',
      hmr: process.env.DISABLE_HMR !== 'true',
      // 开发时同站 /api → Spring Boot，避免请求落到 Vite 自身导致 404
      proxy: {
        '/api': {
          target: env.VITE_DEV_PROXY_TARGET || 'http://localhost:8081',
          changeOrigin: true,
        },
      },
    },
  };
});
