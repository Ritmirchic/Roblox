import { defineConfig } from 'vite';
export default defineConfig({
  root: 'src',
  server: { host: '0.0.0.0', port: 5173, strictPort: true, allowedHosts: true, headers: { 'X-Frame-Options': 'ALLOWALL' }, cors: true, hmr: { host: 'localhost' } },
  build: { outDir: '../dist/web', emptyOutDir: true }
});
