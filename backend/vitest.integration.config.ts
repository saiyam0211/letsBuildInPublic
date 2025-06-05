import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/integration-setup.ts'],
    include: ['src/**/*.integration.test.ts'],
    testTimeout: process.env.CI ? 60000 : 45000, // Increased timeout for CI integration tests
    hookTimeout: process.env.CI ? 240000 : 180000, // Increased hook timeout for CI
    isolate: true, // Run tests in isolation
    retry: process.env.CI ? 3 : 1, // More retries for integration tests in CI
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
