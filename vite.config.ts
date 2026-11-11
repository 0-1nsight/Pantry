import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: '0.0.0.0',
    allowedHosts: ['pantry.vlabs'],
    proxy: {
      '/auth': 'http://localhost:3001',
      '/items': 'http://localhost:3001',
      '/health': 'http://localhost:3001',
    },
  },
});
