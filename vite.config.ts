import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  // Extract repository name for GitHub Pages base path, e.g., "username/repo" -> "/repo/"
  const repo = process.env.GITHUB_REPOSITORY;
  const basePath = repo ? `/${repo.split('/')[1]}/` : '/';

  return {
    base: basePath,
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'prompt',
        manifest: {
          name: '青农课表',
          short_name: '青农课表',
          description: '青岛农业大学学生课表',
          theme_color: '#2D5A27',
          background_color: '#F8FAFC',
          display: 'standalone',
          orientation: 'portrait',
          lang: 'zh-CN',
          start_url: basePath,
          scope: basePath,
          icons: [
            {
              src: `${basePath}icons/icon-192.png`,
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: `${basePath}icons/icon-512.png`,
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
          navigateFallback: `${basePath}index.html`,
        },
        devOptions: {
          enabled: true
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
