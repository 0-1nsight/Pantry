import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/auth': 'http://backend:3001',
      '/items': 'http://backend:3001',
      '/health': 'http://backend:3001',
    },
  },
});