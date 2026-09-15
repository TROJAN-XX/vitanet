import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: false, // Use our existing public/manifest.json
      workbox: {
        // Cache the app shell and static assets
        globPatterns: ['**/*.{js,css,html,ico,svg,woff2}'],
        // Network-first for API calls (never cache)
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\/api\/v1\//,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            // R2 presigned GET URLs — stale-while-revalidate (15-min validity)
            urlPattern: /^https:\/\/.*\.r2\.cloudflarestorage\.com/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'r2-media',
              expiration: { maxAgeSeconds: 60 * 14, maxEntries: 100 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React vendor chunk
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // Admin pages — lazy-load separate chunk (not in initial bundle)
          admin: [
            './src/pages/admin/AdminDashboard.jsx',
            './src/pages/admin/AdminReportsPage.jsx',
            './src/pages/admin/AdminUsersPage.jsx',
            './src/pages/admin/AdminUsagePage.jsx',
          ],
          // Settings pages — rarely visited, lazy load
          settings: [
            './src/pages/settings/SettingsPage.jsx',
            './src/pages/settings/DataExportPage.jsx',
            './src/pages/settings/DeleteAccountPage.jsx',
          ],
        },
      },
    },
  },
});
