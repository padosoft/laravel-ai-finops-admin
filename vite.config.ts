/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Built assets are published to public/vendor/ai-finops-admin in the host app.
  base: '/vendor/ai-finops-admin/',
  plugins: [react(), tailwindcss()],
  // No static public assets to copy; output goes under public/build.
  publicDir: false,
  build: {
    outDir: 'public/build',
    manifest: true,
    emptyOutDir: true,
    rollupOptions: {
      input: 'resources/js/admin/main.tsx',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['resources/js/admin/test/setup.ts'],
    include: ['resources/js/**/*.test.{ts,tsx}'],
  },
});
