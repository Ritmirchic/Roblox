import { defineConfig } from 'vitest/config';

// Dev-only: renders PNG previews of cards and enemies into artifacts/preview.
export default defineConfig({
  test: {
    include: ['tools/**/*.test.ts'],
    environment: 'node',
    testTimeout: 30000,
  },
});
