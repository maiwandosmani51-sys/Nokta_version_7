import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: '/',
  root: '.',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      filename: 'sw.js',
      workbox: {
        cacheId: 'app-cache-v2',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,json}'],
        runtimeCaching: [
          {
            urlPattern: /\/api\/.*/,
            handler: 'NetworkOnly',
            options: {
              cacheName: 'api-cache'
            }
          },
        ],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//]
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg', 'manifest.webmanifest'],
      manifest: {
        name: 'Nokta Academy Management System',
        short_name: 'Nokta Academy',
        description: 'Modern school management system',
        theme_color: '#0ea5e9',
        icons: [
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, '/');

          if (!normalizedId.includes('/node_modules/')) {
            return undefined;
          }

          if (normalizedId.includes('/recharts/')) {
            return 'charts';
          }

          if (normalizedId.includes('/framer-motion/')) {
            return 'motion';
          }

          if (normalizedId.includes('/i18next/') || normalizedId.includes('/react-i18next/')) {
            return 'i18n';
          }

          if (normalizedId.includes('/lucide-react/')) {
            return 'icons';
          }

          if (
            normalizedId.includes('/react/') ||
            normalizedId.includes('/react-dom/') ||
            normalizedId.includes('/scheduler/') ||
            normalizedId.includes('/use-sync-external-store/') ||
            normalizedId.includes('/react-router/') ||
            normalizedId.includes('/react-router-dom/') ||
            normalizedId.includes('/@remix-run/router/') ||
            normalizedId.includes('/@tanstack/')
          ) {
            return 'framework';
          }

          return 'vendor';
        }
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:8081'
    }
  }
});
