import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { assertSafeBrowserBuild } from './src/services/build-safety';

export default defineConfig(({ mode, command }) => {
    const env = { ...process.env, ...loadEnv(mode, '.', '') };
    assertSafeBrowserBuild(command, env);
    return {
      // Relative asset paths: the built app also opens from file:// and
      // from GitHub Pages, where absolute /assets paths resolve nowhere.
      base: './',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), tailwindcss()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, 'src'),
        }
      }
    };
});
