import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    allowedHosts: ['nebulamail-frontend.onrender.com'],
    proxy: {
      '/api': {
        target: 'https://nebulamail.onrender.com',
        changeOrigin: true
      }
    }
  }
});