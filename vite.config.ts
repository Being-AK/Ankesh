import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        hmr: false,
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          injectRegister: 'inline',
          devOptions: {
            enabled: true,
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm,webp,xml,pdf,traineddata}'],
            maximumFileSizeToCacheInBytes: 15 * 1024 * 1024, // Raise limit to 15MB to allow caching qpdf.wasm and eng.traineddata
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/aistudiocdn\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'aistudiocdn-cache',
                  expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                  },
                  cacheableResponse: {
                    statuses: [0, 200],
                  },
                },
              },
              {
                urlPattern: /^https:\/\/esm\.sh\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'esm-sh-cache',
                  expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                  },
                  cacheableResponse: {
                    statuses: [0, 200],
                  },
                },
              },
              {
                urlPattern: /^https:\/\/cdn\.tailwindcss\.com/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'tailwindcss-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365,
                  },
                  cacheableResponse: {
                    statuses: [0, 200],
                  },
                },
              },
              {
                urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts',
                  expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 60 * 60 * 24 * 365,
                  },
                  cacheableResponse: {
                    statuses: [0, 200],
                  },
                },
              },
            ],
          },
          manifest: {
            name: 'Ankesh Kumar | CA Portfolio',
            short_name: 'CAPortfolio',
            description: 'Professional portfolio of Ankesh Kumar with Secure browser-based Professional PDF Toolkit.',
            theme_color: '#0f172a',
            background_color: '#020617',
            display: 'standalone',
            orientation: 'portrait',
            icons: [
              {
                src: '/Hero.webp',
                sizes: '512x512',
                type: 'image/webp',
              },
            ],
          },
        }),
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
