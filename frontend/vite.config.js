import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/graphql': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor':  ['react', 'react-dom', 'react-router-dom'],
          'apollo-vendor': ['@apollo/client', 'graphql'],
          'map-vendor':    ['leaflet', 'react-leaflet'],
          'chart-vendor':  ['recharts'],
          'keycloak':      ['keycloak-js'],
        },
      },
    },
  },
});
