import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    server: {
      hmr: false,
    },
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      'process.env.STRIPE_PUBLIC_KEY': JSON.stringify(env.STRIPE_PUBLIC_KEY)
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  };
});