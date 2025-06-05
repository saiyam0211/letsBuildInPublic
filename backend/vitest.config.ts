import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['src/**/*.integration.test.ts'],
    testTimeout: process.env.CI ? 30000 : 15000, // Increased timeout for CI
    hookTimeout: process.env.CI ? 180000 : 120000, // Increased hook timeout for CI
    isolate: true, // Run tests in isolation
    retry: process.env.CI ? 2 : 0, // Retry tests in CI environment
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.ts',
        'dist/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
