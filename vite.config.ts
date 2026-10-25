import { defineConfig } from 'vite';

// On GitHub Pages the game is served from https://<user>.github.io/<repo>/
// so production builds need a matching base path. Dev/preview stay at root.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? (process.env.BASE_PATH ?? '/Roblox/') : '/',
  build: {
    outDir: 'docs',
    emptyOutDir: true,
    target: 'es2020',
    sourcemap: false,
    assetsInlineLimit: 4096,
  },
  server: { host: '0.0.0.0', port: 5173, strictPort: true },
  preview: { host: '0.0.0.0', port: 4173, strictPort: true },
}));
