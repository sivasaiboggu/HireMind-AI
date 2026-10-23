import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { assertSafeBrowserBuild } from './src/services/build-safety';

export default defineConfig(({ mode, command }) => {
    const env = { ...process.env, ...loadEnv(mode, '.', '') };
    assertSafeBrowserBuild(command, env);
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, 'src'),
        }
      }
    };
});
