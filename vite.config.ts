import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: true,
        },
        includeAssets: ['favicon.ico', 'icon.svg'],
        manifest: {
          id: '/',
          name: 'Las Tres Llaves: Edición Definitiva',
          short_name: 'TresLlaves',
          description: 'Juego de acción y aventura con progresión por niveles, recompensas diarias, tablas globales, desafíos semanales, avatares personalizables y modo offline.',
          theme_color: '#121814',
          background_color: '#0e130f',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"%3E%3Crect width="192" height="192" fill="%231b221a" rx="40"/%3E%3Cpath d="M96 32 C65 32 40 57 40 88 C40 108 51 125 68 135 L68 152 L96 152 L96 140 L112 140 L112 128 L96 128 L96 112 L104 112 C130 112 152 90 152 64 C152 46 138 32 96 32 Z M96 64 A16 16 0 1 1 96 96 A16 16 0 1 1 96 64 Z" fill="%23ffd23f"/%3E%3C/svg%3E',
              sizes: '192x192',
              type: 'image/svg+xml',
              purpose: 'any',
            },
            {
              src: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"%3E%3Crect width="512" height="512" fill="%231b221a" rx="100"/%3E%3Cpath d="M256 80 C170 80 100 150 100 236 C100 290 130 336 176 362 L176 410 L256 410 L256 380 L296 380 L296 348 L256 348 L256 304 L276 304 C348 304 412 244 412 172 C412 120 370 80 256 80 Z M256 160 A42 42 0 1 1 256 244 A42 42 0 1 1 256 160 Z" fill="%23ffd23f"/%3E%3C/svg%3E',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'any',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

