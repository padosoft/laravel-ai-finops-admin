import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Dev-server config for the Playwright e2e harness only: serves the standalone
// index.html at the site root (base '/') so the SPA router basename is '/'.
// Production build/serve still uses vite.config.ts (base '/vendor/ai-finops-admin/').
export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  server: { port: 5174, strictPort: true },
});
